import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    subject: string;
    message: string;
  }) {
    const notification = this.notificationRepository.create({
      ...data,
      status: NotificationStatus.PENDING,
    });

    return this.notificationRepository.save(notification);
  }

  async markSent(id: string) {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  async markFailed(id: string, reason: string) {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.FAILED,
      failedAt: new Date(),
      failureReason: reason,
    });
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * MVP delivery abstraction.
   *
   * Later replace this with:
   * Email provider
   * Push provider
   * SMS provider
   */
  async send(notification: Notification) {
    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification);
          break;

        case NotificationChannel.PUSH:
          await this.sendPush(notification);
          break;

        case NotificationChannel.SMS:
          await this.sendSms(notification);
          break;
      }

      await this.markSent(notification.id);
    } catch (error) {
      await this.markFailed(
        notification.id,
        error instanceof Error ? error.message : 'Notification delivery failed',
      );

      throw error;
    }
  }

  private async sendEmail(notification: Notification) {
    // TODO:
    // Integrate SES / SendGrid / Resend.

    throw new ServiceUnavailableException(
      'Notification delivery is not configured.',
    );
  }

  private async sendPush(notification: Notification) {
    // TODO:
    // Integrate FCM / APNs.

    throw new ServiceUnavailableException(
      'Notification delivery is not configured.',
    );
  }

  private async sendSms(notification: Notification) {
    // TODO:
    // Integrate Twilio / AWS SNS.

    throw new ServiceUnavailableException(
      'Notification delivery is not configured.',
    );
  }
}
