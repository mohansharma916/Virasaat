import {
  Injectable,
  Logger,
  Optional,
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
import { EmailTemplateService } from './email/email-template.service';
import {
  EmailTemplateDataMap,
  EmailTemplateType,
  RenderedEmail,
} from './email/email-template.types';
import { MailService, SendEmailResult } from './email/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Optional()
    private readonly emailTemplateService?: EmailTemplateService,
    @Optional()
    private readonly mailService?: MailService,
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
   * High-level helper to render a typed email template and dispatch it via Nodemailer.
   */
  async sendTemplatedEmail<T extends EmailTemplateType>(options: {
    to: string;
    userId?: string;
    templateType: T;
    data: EmailTemplateDataMap[T];
  }): Promise<RenderedEmail & { deliveryResult?: SendEmailResult }> {
    const service = this.emailTemplateService || new EmailTemplateService();
    const rendered = service.render(options.templateType, options.data);

    this.logger.log(
      `[Email Dispatch] Sending ${options.templateType} to ${options.to} | Subject: "${rendered.subject}"`,
    );

    let deliveryResult: SendEmailResult | undefined;

    if (this.mailService) {
      deliveryResult = await this.mailService.sendMail({
        to: options.to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
    }

    // If userId is provided, save in notifications ledger
    if (options.userId) {
      try {
        const notif = await this.create({
          userId: options.userId,
          type: this.mapTemplateTypeToNotificationType(options.templateType),
          channel: NotificationChannel.EMAIL,
          subject: rendered.subject,
          message: rendered.text,
        });

        if (deliveryResult && !deliveryResult.success) {
          await this.markFailed(
            notif.id,
            deliveryResult.error || 'SMTP delivery failed',
          );
        } else {
          await this.markSent(notif.id);
        }
      } catch (err) {
        this.logger.warn(
          `Could not record notification ledger entry: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      ...rendered,
      deliveryResult,
    };
  }

  /**
   * MVP delivery abstraction.
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
    // In development or when transport is not yet provisioned, log gracefully
    this.logger.log(
      `[MOCK EMAIL SENT] User ${notification.userId} | Subject: "${notification.subject}"`,
    );
  }

  private async sendPush(notification: Notification) {
    this.logger.log(
      `[MOCK PUSH SENT] User ${notification.userId} | Subject: "${notification.subject}"`,
    );
  }

  private async sendSms(notification: Notification) {
    this.logger.log(
      `[MOCK SMS SENT] User ${notification.userId} | Subject: "${notification.subject}"`,
    );
  }

  private mapTemplateTypeToNotificationType(
    templateType: EmailTemplateType,
  ): NotificationType {
    switch (templateType) {
      case EmailTemplateType.CHECK_IN_REMINDER:
        return NotificationType.CHECK_IN_REMINDER;
      case EmailTemplateType.CHECK_IN_MISSED:
        return NotificationType.CHECK_IN_MISSED;
      case EmailTemplateType.RELEASE_CASE_OPENED:
        return NotificationType.RELEASE_CASE_OPENED;
      case EmailTemplateType.RELEASE_AUTHORIZED:
        return NotificationType.RELEASE_AUTHORIZED;
      case EmailTemplateType.TRUSTED_PERSON_INVITATION:
        return NotificationType.RECIPIENT_INVITATION;
      case EmailTemplateType.SECURITY_ALERT:
      case EmailTemplateType.PASSWORD_RESET:
        return NotificationType.SECURITY_ALERT;
      default:
        return NotificationType.SECURITY_ALERT;
    }
  }
}

