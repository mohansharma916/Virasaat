import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';

import { CheckInPolicy } from './entities/check-in-policy.entity';
import { CheckInEvent } from './entities/check-in-event.entity';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notification/notification.module';
import { UsersModule } from '../users/users.module';
import { ReleaseModule } from '../release/release.module';
import { ReleasePolicy } from '../release/entities/release-policy.entity';
import { ReleaseCase } from '../release/entities/release-case.entity';
import { CheckInMonitorService } from './check-in-monitor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckInPolicy,
      CheckInEvent,
      ReleasePolicy,
      ReleaseCase,
    ]),
    SubscriptionsModule,
    NotificationsModule,
    UsersModule,
    ReleaseModule,
  ],

  controllers: [CheckInController],

  providers: [CheckInService, CheckInMonitorService],

  exports: [CheckInService],
})
export class CheckInModule {}
