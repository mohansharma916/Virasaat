import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { VaultModule } from '../vault/vault.module';
import { NotificationsModule } from '../notification/notification.module';
import { EmailSignup } from './entities/email-signup.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthRateLimit } from './entities/auth-rate-limit.entity';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';

@Module({
  imports: [
    UsersModule,
    VaultModule,
    NotificationsModule,
    TypeOrmModule.forFeature([EmailSignup, PasswordReset, AuthRateLimit]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '7d',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuthRateLimitService,
    AuthRateLimitGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
