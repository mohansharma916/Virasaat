import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { ReauthService } from './reauth.service';
import { AuthRateLimit } from '../auth/entities/auth-rate-limit.entity';
import { AuthRateLimitService } from '../auth/auth-rate-limit.service';
import { UsersController } from './users.controller';
import { AccountDeletionService } from './account-deletion.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthRateLimit]),
    StorageModule,
    NotificationsModule,
  ],

  providers: [
    UsersService,
    ReauthService,
    AuthRateLimitService,
    AccountDeletionService,
  ],

  controllers: [UsersController],

  exports: [UsersService, ReauthService, AuthRateLimitService],
})
export class UsersModule {}
