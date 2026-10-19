import { Injectable, Logger, Optional } from '@nestjs/common';

import type { ReminderChannel } from '../check-in/check-in-schedule';
import { FcmPushSender } from './channels/fcm-push.sender';
import { ExotelCallSender, ExotelSmsSender } from './channels/exotel.senders';

export interface ReminderMessage {
  /** Short text for push, SMS and voice. */
  title: string;
  body: string;
  /** DLT-registered SMS text (India). SMS is skipped without it. */
  sms?: string;
  /** The full email, already addressed. */
  sendEmail: () => Promise<unknown>;
}

export interface ChannelSender {
  readonly channel: Exclude<ReminderChannel, 'EMAIL'>;
  isConfigured(): boolean;
  send(to: { userId: string; phone: string | null }, message: ReminderMessage): Promise<void>;
}

/**
 * Delivers one reminder over several channels. Email is live. Push, SMS and
 * voice calls plug in as ChannelSenders once a provider is configured
 * (for example Expo/FCM push, or an SMS/voice provider); until then they are
 * skipped and reported once, never silently counted as delivered.
 */
@Injectable()
export class ReminderChannelsService {
  private readonly logger = new Logger(ReminderChannelsService.name);
  private readonly senders = new Map<ReminderChannel, ChannelSender>();
  private readonly reportedMissing = new Set<ReminderChannel>();

  constructor(
    @Optional() push?: FcmPushSender,
    @Optional() sms?: ExotelSmsSender,
    @Optional() call?: ExotelCallSender,
  ) {
    for (const sender of [push, sms, call]) if (sender) this.register(sender);
  }

  register(sender: ChannelSender) {
    this.senders.set(sender.channel, sender);
  }

  async deliver(
    to: { userId: string; phone: string | null },
    channels: ReminderChannel[],
    message: ReminderMessage,
  ) {
    const delivered: ReminderChannel[] = [];
    for (const channel of new Set(channels)) {
      try {
        if (channel === 'EMAIL') {
          await message.sendEmail();
          delivered.push(channel);
          continue;
        }
        const sender = this.senders.get(channel);
        if (!sender?.isConfigured()) {
          if (!this.reportedMissing.has(channel)) {
            this.reportedMissing.add(channel);
            this.logger.warn(`${channel} reminders are not configured yet; only available channels were used.`);
          }
          continue;
        }
        await sender.send(to, message);
        delivered.push(channel);
      } catch {
        this.logger.warn(`A ${channel} reminder could not be delivered.`);
      }
    }
    return delivered;
  }
}
