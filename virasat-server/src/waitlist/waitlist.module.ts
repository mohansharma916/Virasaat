import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Waitlist } from './entities/waitlist.entity';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
import { NotificationsModule } from '../notification/notification.module';
import { AuthRateLimit } from '../auth/entities/auth-rate-limit.entity';
import { AuthRateLimitService } from '../auth/auth-rate-limit.service';
import { WaitlistRateLimitGuard } from './waitlist-rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Waitlist, AuthRateLimit]),
    NotificationsModule,
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService, AuthRateLimitService, WaitlistRateLimitGuard],
  exports: [WaitlistService],
})
export class WaitlistModule {}
