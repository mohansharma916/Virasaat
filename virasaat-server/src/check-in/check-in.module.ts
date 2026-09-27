import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';

import { CheckInPolicy } from './entities/check-in-policy.entity';
import { CheckInEvent } from './entities/check-in-event.entity';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckInPolicy, CheckInEvent]),
    SubscriptionsModule,
  ],

  controllers: [CheckInController],

  providers: [CheckInService],

  exports: [CheckInService],
})
export class CheckInModule {}
