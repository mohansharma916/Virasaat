import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { EmailTemplateService } from './email/email-template.service';
import { EmailPreviewController } from './email/email-preview.controller';
import { MailService } from './email/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [EmailPreviewController],
  providers: [NotificationsService, EmailTemplateService, MailService],
  exports: [NotificationsService, EmailTemplateService, MailService],
})
export class NotificationsModule {}

