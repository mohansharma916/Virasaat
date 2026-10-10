import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { EmailTemplateService } from './email/email-template.service';
import { EmailPreviewController } from './email/email-preview.controller';
import { MailService } from './email/mail.service';
import { EmailDiagnosticsGuard } from './email/email-diagnostics.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers:
    process.env.NODE_ENV === 'development' ? [EmailPreviewController] : [],
  providers: [
    NotificationsService,
    EmailTemplateService,
    MailService,
    EmailDiagnosticsGuard,
  ],
  exports: [NotificationsService, EmailTemplateService, MailService],
})
export class NotificationsModule {}
