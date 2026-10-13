import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { ReauthService } from './reauth.service';
import { AuthRateLimit } from '../auth/entities/auth-rate-limit.entity';
import { AuthRateLimitService } from '../auth/auth-rate-limit.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthRateLimit])],

  providers: [UsersService, ReauthService, AuthRateLimitService],

  controllers: [UsersController],

  exports: [UsersService, ReauthService, AuthRateLimitService],
})
export class UsersModule {}
