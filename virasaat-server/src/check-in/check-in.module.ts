import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';

import { CheckInPolicy } from './entities/check-in-policy.entity';
import { CheckInEvent } from './entities/check-in-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckInPolicy, CheckInEvent])],

  controllers: [CheckInController],

  providers: [CheckInService],

  exports: [CheckInService],
})
export class CheckInModule {}
