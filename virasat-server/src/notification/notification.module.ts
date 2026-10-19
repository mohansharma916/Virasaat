import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { EmailTemplateService } from './email/email-template.service';
import { EmailPreviewController } from './email/email-preview.controller';
import { MailService } from './email/mail.service';
import { EmailDiagnosticsGuard } from './email/email-diagnostics.guard';
import { ReminderChannelsService } from './reminder-channels.service';
import { PushToken } from './entities/push-token.entity';
import { FcmPushSender } from './channels/fcm-push.sender';
import {
  ExotelCallSender,
  ExotelClient,
  ExotelSmsSender,
} from './channels/exotel.senders';
import { PushTokensController } from './push-tokens.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, PushToken])],
  controllers: [
    PushTokensController,
    ...(process.env.NODE_ENV === 'development' ? [EmailPreviewController] : []),
  ],
  providers: [
    NotificationsService,
    EmailTemplateService,
    MailService,
    EmailDiagnosticsGuard,
    ReminderChannelsService,
    FcmPushSender,
    ExotelClient,
    ExotelSmsSender,
    ExotelCallSender,
  ],
  exports: [
    NotificationsService,
    EmailTemplateService,
    MailService,
    ReminderChannelsService,
  ],
})
export class NotificationsModule {}
