import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ChannelSender, ReminderMessage } from '../reminder-channels.service';

/** Normalizes a saved phone number to E.164; bare 10-digit numbers are Indian. */
export function toE164(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  if (/^\+\d{10,15}$/.test(digits)) return digits;
  const bare = digits.replace(/^\+/, '');
  if (/^[6-9]\d{9}$/.test(bare)) return `+91${bare}`;
  if (/^0[6-9]\d{9}$/.test(bare)) return `+91${bare.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(bare)) return `+${bare}`;
  return null;
}

/**
 * Exotel account settings. SMS in India must match a template registered on
 * the DLT portal, so the text sent is fixed (see EXOTEL_SMS_TEMPLATE below).
 */
@Injectable()
export class ExotelClient {
  private readonly logger = new Logger(ExotelClient.name);
  readonly sid: string | undefined;
  private readonly key: string | undefined;
  private readonly token: string | undefined;
  private readonly host: string;
  readonly smsFrom: string | undefined;
  readonly dltEntityId: string | undefined;
  readonly dltTemplateId: string | undefined;
  readonly callerId: string | undefined;
  readonly callFlowId: string | undefined;

  constructor(config: ConfigService) {
    this.sid = config.get<string>('EXOTEL_SID');
    this.key = config.get<string>('EXOTEL_API_KEY');
    this.token = config.get<string>('EXOTEL_API_TOKEN');
    // api.exotel.com (Singapore) or api.in.exotel.com (Mumbai), per your account.
    this.host = config.get<string>('EXOTEL_SUBDOMAIN') || 'api.in.exotel.com';
    this.smsFrom = config.get<string>('EXOTEL_SMS_FROM');
    this.dltEntityId = config.get<string>('EXOTEL_DLT_ENTITY_ID');
    this.dltTemplateId = config.get<string>('EXOTEL_DLT_TEMPLATE_ID');
    this.callerId = config.get<string>('EXOTEL_CALLER_ID');
    this.callFlowId = config.get<string>('EXOTEL_CALL_FLOW_ID');
  }

  hasAccount() {
    return Boolean(this.sid && this.key && this.token);
  }

  async post(path: string, form: Record<string, string>) {
    const response = await fetch(`https://${this.host}/v1/Accounts/${this.sid}/${path}`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${this.key}:${this.token}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      this.logger.warn(`Exotel ${path} failed (${response.status}).`);
      throw new Error(`Exotel request failed (${response.status}).`);
    }
  }
}

/**
 * The SMS text. It must match your DLT-registered template exactly, with
 * {#var#} placeholders in place of the overdue days and the deadline date:
 *   "Virasat: you have not checked in for {#var#} days. Open the Virasat app and check in before {#var#}, or a release review will start. - Virasat"
 */
export function reminderSms(overdueDays: number, deadline: string) {
  return `Virasat: you have not checked in for ${overdueDays} days. Open the Virasat app and check in before ${deadline}, or a release review will start. - Virasat`;
}

@Injectable()
export class ExotelSmsSender implements ChannelSender {
  readonly channel = 'SMS' as const;
  constructor(private readonly exotel: ExotelClient) {}

  isConfigured() {
    return this.exotel.hasAccount() && Boolean(this.exotel.smsFrom && this.exotel.dltTemplateId);
  }

  async send(to: { phone: string | null }, message: ReminderMessage) {
    const number = toE164(to.phone);
    if (!number || !message.sms) return;
    await this.exotel.post('Sms/send.json', {
      From: this.exotel.smsFrom!,
      To: number,
      Body: message.sms,
      DltTemplateId: this.exotel.dltTemplateId!,
      ...(this.exotel.dltEntityId ? { DltEntityId: this.exotel.dltEntityId } : {}),
    });
  }
}

/**
 * An automated call that plays the reminder flow you build in Exotel
 * (App Bazaar): a short message asking the owner to open Virasat and check in.
 */
@Injectable()
export class ExotelCallSender implements ChannelSender {
  readonly channel = 'CALL' as const;
  constructor(private readonly exotel: ExotelClient) {}

  isConfigured() {
    return this.exotel.hasAccount() && Boolean(this.exotel.callerId && this.exotel.callFlowId);
  }

  async send(to: { phone: string | null }) {
    const number = toE164(to.phone);
    if (!number) return;
    await this.exotel.post('Calls/connect.json', {
      From: number,
      CallerId: this.exotel.callerId!,
      Url: `http://my.exotel.com/${this.exotel.sid}/exoml/start_voice/${this.exotel.callFlowId}`,
    });
  }
}
