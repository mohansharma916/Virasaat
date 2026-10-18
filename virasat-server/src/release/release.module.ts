import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReleaseController } from './release.controller';
import { ReleaseService } from './release.service';

import { ReleasePolicy } from './entities/release-policy.entity';
import { ReleaseCase } from './entities/release-case.entity';
import { ReleaseAuthorization } from './entities/release-authorization.entity';

import { Recipient } from '../recipients/entities/recipient.entity';
import { CheckInEvent } from '../check-in/entities/check-in-event.entity';
import { AuditModule } from '../audit/audit.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notification/notification.module';
import { LegacyItemsModule } from '../legacy-items/legacy-items.module';
import { ReleaseFlowService } from './release-flow.service';
import { SharedController } from './shared.controller';
import { AdminReleaseController } from './admin-release.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReleasePolicy,
      ReleaseCase,
      ReleaseAuthorization,
      Recipient,
      CheckInEvent,
    ]),
    AuditModule,
    SubscriptionsModule,
    UsersModule,
    NotificationsModule,
    LegacyItemsModule,
  ],

  controllers: [ReleaseController, SharedController, AdminReleaseController],

  providers: [ReleaseService, ReleaseFlowService],

  exports: [ReleaseService, ReleaseFlowService],
})
export class ReleaseModule {}
