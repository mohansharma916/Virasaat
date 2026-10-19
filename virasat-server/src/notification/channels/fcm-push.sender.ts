import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  GoogleApiClient,
  loadServiceAccount,
} from '../../common/google-service-account';
import { PushToken } from '../entities/push-token.entity';
import type { ChannelSender, ReminderMessage } from '../reminder-channels.service';

/**
 * App notifications through Firebase Cloud Messaging (HTTP v1). Configure
 * FIREBASE_SERVICE_ACCOUNT (JSON, base64 JSON, or a file path) from Firebase
 * Console > Project settings > Service accounts.
 */
@Injectable()
export class FcmPushSender implements ChannelSender {
  readonly channel = 'PUSH' as const;
  private readonly logger = new Logger(FcmPushSender.name);
  private readonly client: GoogleApiClient | null;

  constructor(
    config: ConfigService,
    @InjectRepository(PushToken)
    private readonly tokens: Repository<PushToken>,
  ) {
    const key = loadServiceAccount(config.get<string>('FIREBASE_SERVICE_ACCOUNT'));
    this.client =
      key?.project_id
        ? new GoogleApiClient(key, 'https://www.googleapis.com/auth/firebase.messaging')
        : null;
  }

  isConfigured() {
    return Boolean(this.client);
  }

  async register(userId: string, token: string, platform: string) {
    // A device belongs to whoever signed in on it last.
    await this.tokens.upsert({ userId, token, platform }, ['token']);
  }

  async unregister(userId: string, token: string) {
    await this.tokens.delete({ userId, token });
  }

  async send(to: { userId: string }, message: ReminderMessage) {
    if (!this.client) return;
    const devices = await this.tokens.find({ where: { userId: to.userId } });
    for (const device of devices) {
      const result = await this.client.request<{ error?: { status?: string } }>(
        `https://fcm.googleapis.com/v1/projects/${this.client.key.project_id}/messages:send`,
        {
          method: 'POST',
          body: {
            message: {
              token: device.token,
              notification: { title: message.title, body: message.body },
              android: { priority: 'HIGH', notification: { channel_id: 'reminders' } },
              data: { route: 'home' },
            },
          },
        },
      );
      if (result.status === 404 || result.data?.error?.status === 'UNREGISTERED') {
        await this.tokens.delete({ id: device.id });
      } else if (!result.ok) {
        this.logger.warn(`A push notification failed (${result.status}).`);
      }
    }
  }
}
