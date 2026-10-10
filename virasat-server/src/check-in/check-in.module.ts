import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';

import { CheckInPolicy } from './entities/check-in-policy.entity';
import { CheckInEvent } from './entities/check-in-event.entity';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notification/notification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckInPolicy, CheckInEvent]),
    SubscriptionsModule,
    NotificationsModule,
    UsersModule,
  ],

  controllers: [CheckInController],

  providers: [CheckInService],

  exports: [CheckInService],
})
export class CheckInModule {}
