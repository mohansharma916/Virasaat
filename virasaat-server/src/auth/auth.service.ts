import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { VaultService } from '../vault/vault.service';
import { Vault, VaultStatus } from '../vault/entities/vault.entity';
import { NotificationsService } from '../notification/notifications.service';
import { EmailTemplateType } from '../notification/email/email-template.types';
import { getEmailAppLink } from '../notification/email/email-links';
import { EmailSignup } from './entities/email-signup.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { AuthRateLimitService } from './auth-rate-limit.service';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly vaultService: VaultService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(EmailSignup)
    private readonly emailSignupRepository: Repository<EmailSignup>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly rateLimiter: AuthRateLimitService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async register(email: string, name: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.rateLimiter.checkAccount('signup-send', normalizedEmail);
    const passwordHash = await bcrypt.hash(password, 12);
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await this.withAccountLock(
      this.emailSignupRepository,
      normalizedEmail,
      async (manager) => {
        const existingUser = await manager
          .getRepository(User)
          .findOne({ where: { email: normalizedEmail } });
        if (existingUser)
          throw new ConflictException(
            'An account already exists with this email. Please login.',
          );
        const signups = manager.getRepository(EmailSignup);
        const existing = await signups.findOne({
          where: { email: normalizedEmail, verified: false },
          order: { createdAt: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });
        if (existing) this.assertSendCooldown(existing.lastSentAt);
        const signup =
          existing ??
          signups.create({ email: normalizedEmail, verified: false });
        Object.assign(signup, {
          name,
          passwordHash,
          otpHash,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          lastSentAt: new Date(),
          attempts: 0,
        });
        await signups.save(signup);
      },
    );
    await this.sendSignupOtp(normalizedEmail, name, otp);
    return {
      success: true,
      message:
        'OTP sent to your email. Please verify your email to complete signup.',
      ...this.developmentOtp(otp),
    };
  }

  async verifyEmail(email: string, otp: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.rateLimiter.checkAccount('signup-verify', normalizedEmail);
    const result = await this.withAccountLock(
      this.emailSignupRepository,
      normalizedEmail,
      async (manager) => {
        const users = manager.getRepository(User);
        if (await users.findOne({ where: { email: normalizedEmail } }))
          throw new ConflictException(
            'An account already exists with this email.',
          );
        const signups = manager.getRepository(EmailSignup);
        const signup = await signups.findOne({
          where: { email: normalizedEmail, verified: false },
          order: { createdAt: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });
        if (!signup)
          throw new UnauthorizedException(
            'Signup session not found or expired.',
          );
        if (signup.otpExpiresAt <= new Date())
          throw new UnauthorizedException(
            'OTP has expired. Please request signup again.',
          );
        if (signup.attempts >= 5)
          throw new UnauthorizedException('Too many OTP attempts.');
        signup.attempts += 1;
        if (!(await bcrypt.compare(otp, signup.otpHash))) {
          await signups.save(signup);
          // Commit failed attempts; throwing here would roll the counter back.
          return { error: new UnauthorizedException('Invalid OTP.') };
        }
        const user = await users.save(
          users.create({
            email: signup.email,
            name: signup.name,
            passwordHash: signup.passwordHash,
            emailVerified: true,
            googleId: null,
            avatar: null,
            status: UserStatus.ACTIVE,
            sessionVersion: 0,
          }),
        );
        const vaults = manager.getRepository(Vault);
        const vault = await vaults.save(
          vaults.create({
            userId: user.id,
            status: VaultStatus.ACTIVE,
            readinessScore: 0,
          }),
        );
        signup.verified = true;
        await signups.save(signup);
        return { user, vault };
      },
    );
    if ('error' in result) {
      const reason: unknown = result.error;
      throw reason instanceof Error
        ? reason
        : new UnauthorizedException('Invalid OTP.');
    }
    await this.sendWelcome(result.user, result.vault.id);
    return this.loginPayload(result.user, result.vault);
  }

  async resendVerification(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.rateLimiter.checkAccount('signup-send', normalizedEmail);
    const otp = this.generateOtp();
    const result = await this.withAccountLock(
      this.emailSignupRepository,
      normalizedEmail,
      async (manager) => {
        const signups = manager.getRepository(EmailSignup);
        const signup = await signups.findOne({
          where: { email: normalizedEmail, verified: false },
          order: { createdAt: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });
        if (!signup) return null;
        this.assertSendCooldown(signup.lastSentAt);
        signup.otpHash = await bcrypt.hash(otp, 10);
        signup.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        signup.lastSentAt = new Date();
        signup.attempts = 0;
        await signups.save(signup);
        return { name: signup.name };
      },
    );
    if (result) await this.sendSignupOtp(normalizedEmail, result.name, otp);
    return {
      success: true,
      message:
        'If a verification is pending, a new code has been sent to your email.',
      ...(result ? this.developmentOtp(otp) : {}),
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.rateLimiter.checkAccount('login', normalizedEmail);
    const user =
      await this.usersService.findByEmailWithPassword(normalizedEmail);
    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    )
      throw new UnauthorizedException('Invalid email or password.');
    return this.loginPayload(
      user,
      await this.vaultService.findByUserId(user.id),
    );
  }

  async googleLogin(idToken: string) {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token.');
    }
    if (!payload?.sub || !payload.email || !payload.email_verified)
      throw new UnauthorizedException('Invalid Google account.');
    const email = this.normalizeEmail(payload.email);
    await this.rateLimiter.checkAccount('google', email);
    let user = await this.usersService.findByGoogleId(payload.sub);
    if (user) return this.loginWithUser(user);
    user = await this.usersService.findByEmail(email);
    if (user) {
      if (user.status !== UserStatus.ACTIVE)
        throw new UnauthorizedException('Account is unavailable.');
      user =
        (await this.usersService.update(user.id, {
          googleId: payload.sub,
          avatar: user.avatar ?? payload.picture ?? null,
          emailVerified: true,
        })) ?? user;
      return this.loginWithUser(user);
    }
    user = await this.usersService.create({
      email,
      name: payload.name ?? email.split('@')[0],
      avatar: payload.picture ?? null,
      googleId: payload.sub,
      passwordHash: null,
      emailVerified: true,
      sessionVersion: 0,
    });
    const vault = await this.vaultService.createForUser(user.id);
    await this.sendWelcome(user, vault.id);
    return this.loginPayload(user, vault);
  }

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.rateLimiter.checkAccount('reset-send', normalizedEmail);
    const otp = this.generateOtp();
    const result = await this.withAccountLock(
      this.passwordResetRepository,
      normalizedEmail,
      async (manager) => {
        const user = await manager
          .getRepository(User)
          .createQueryBuilder('user')
          .addSelect('user.passwordHash')
          .where('user.email = :email', { email: normalizedEmail })
          .setLock('pessimistic_write')
          .getOne();
        if (!user || user.status !== UserStatus.ACTIVE)
          return { status: 'NOT_FOUND' as const };
        if (user.googleId && !user.passwordHash)
          return { status: 'GOOGLE_ACCOUNT' as const, user };
        const resets = manager.getRepository(PasswordReset);
        const lastReset = await resets.findOne({
          where: { email: normalizedEmail },
          order: { createdAt: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });
        if (lastReset) this.assertSendCooldown(lastReset.lastSentAt);
        await resets.update(
          { email: normalizedEmail, used: false },
          { used: true },
        );
        await resets.save(
          resets.create({
            email: normalizedEmail,
            otpHash: await bcrypt.hash(otp, 10),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            lastSentAt: new Date(),
            attempts: 0,
            used: false,
          }),
        );
        return { status: 'OTP_SENT' as const, user };
      },
    );
    if (result.status === 'NOT_FOUND')
      return {
        status: result.status,
        message:
          'No Virasaat account found with this email address. Please check your email or sign up.',
      };
    if (result.status === 'GOOGLE_ACCOUNT')
      return {
        status: result.status,
        authMethod: 'GOOGLE',
        message:
          'This account was created with Google Sign-In. You do not have a separate password.',
        email: result.user.email,
        name: result.user.name,
      };
    await this.sendOtpEmail({
      to: normalizedEmail,
      templateType: EmailTemplateType.PASSWORD_RESET,
      data: {
        recipientName: result.user.name,
        resetCode: otp,
        expiryMinutes: 15,
        resetUrl: getEmailAppLink(
          'recovery',
          { email: normalizedEmail, mode: 'reset' },
          this.configService,
        ),
      },
    });
    return {
      status: 'OTP_SENT',
      authMethod: 'PASSWORD',
      message: 'A 6-digit password reset code has been sent to your email.',
      email: result.user.email,
      ...this.developmentOtp(otp),
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.rateLimiter.checkAccount('reset-verify', normalizedEmail);
    const result = await this.withAccountLock(
      this.passwordResetRepository,
      normalizedEmail,
      async (manager) => {
        const users = manager.getRepository(User);
        const user = await users.findOne({
          where: { email: normalizedEmail, status: UserStatus.ACTIVE },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user)
          throw new BadRequestException('No account found with this email.');
        const resets = manager.getRepository(PasswordReset);
        const reset = await resets.findOne({
          where: { email: normalizedEmail, used: false },
          order: { createdAt: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });
        if (!reset)
          throw new BadRequestException(
            'No active password reset request found. Please request a new code.',
          );
        if (reset.expiresAt <= new Date())
          throw new BadRequestException(
            'Password reset code has expired. Please request a new code.',
          );
        if (reset.attempts >= 5)
          throw new BadRequestException(
            'Too many failed attempts. Please request a new reset code.',
          );
        if (!(await bcrypt.compare(otp, reset.otpHash))) {
          reset.attempts += 1;
          await resets.save(reset);
          return {
            error: new BadRequestException(
              'Invalid verification code. Please check and try again.',
            ),
          };
        }
        user.passwordHash = await bcrypt.hash(newPassword, 12);
        user.emailVerified = true;
        user.sessionVersion += 1;
        await users.save(user);
        reset.used = true;
        await resets.save(reset);
        return { user };
      },
    );
    if ('error' in result) {
      const reason: unknown = result.error;
      throw reason instanceof Error
        ? reason
        : new BadRequestException('Invalid verification code.');
    }
    await this.notificationsService
      ?.sendTemplatedEmail({
        to: normalizedEmail,
        userId: result.user.id,
        templateType: EmailTemplateType.SECURITY_ALERT,
        data: {
          recipientName: result.user.name,
          alertTitle: 'Password Changed',
          alertDescription:
            'Your account password was reset and all previous sessions were signed out. If you did not perform this action, contact support.',
          eventTime: new Date().toUTCString(),
          deviceInfo: 'Virasaat Account Recovery',
          reviewActivityUrl: getEmailAppLink(
            'security',
            {},
            this.configService,
          ),
        },
      })
      .catch(() =>
        this.logger.warn(
          'Password recovery security notification could not be delivered.',
        ),
      );
    return {
      success: true,
      message:
        'Your password has been successfully reset. Please sign in with your new password.',
    };
  }

  async resendPasswordReset(email: string) {
    return this.forgotPassword(email);
  }

  async logout(userId: string) {
    await this.emailSignupRepository.manager.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.findOne({
        where: { id: userId, status: UserStatus.ACTIVE },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new UnauthorizedException('Account is unavailable.');
      user.sessionVersion += 1;
      await users.save(user);
    });
    return { success: true };
  }

  private async withAccountLock<T>(
    repository: Repository<EmailSignup> | Repository<PasswordReset>,
    email: string,
    run: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return repository.manager.transaction(async (manager) => {
      // Serialize initial challenge creation too, when no challenge row exists yet.
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `auth:${email}`,
      ]);
      return run(manager);
    });
  }

  private assertSendCooldown(lastSentAt: Date) {
    const remaining =
      60 - Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 1000);
    if (remaining > 0)
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'OTP_RESEND_COOLDOWN',
          message: 'Please wait before requesting another verification code.',
          retryAfterSeconds: remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  private async loginWithUser(user: User) {
    if (user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException('Account is unavailable.');
    const vault =
      (await this.vaultService.findByUserId(user.id)) ??
      (await this.vaultService.createForUser(user.id));
    return this.loginPayload(user, vault);
  }

  private async loginPayload(user: User, vault: Vault | null) {
    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        sessionVersion: user.sessionVersion,
      }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      vault: vault
        ? { id: vault.id, readinessScore: vault.readinessScore }
        : null,
    };
  }

  private async sendSignupOtp(to: string, name: string, otp: string) {
    await this.sendOtpEmail({
      to,
      templateType: EmailTemplateType.OTP_VERIFICATION,
      data: {
        recipientName: name,
        otpCode: otp,
        expiryMinutes: 10,
        purpose: 'SIGNUP',
      },
    });
  }

  private async sendOtpEmail(
    options: Parameters<NotificationsService['sendTemplatedEmail']>[0],
  ) {
    if (!this.notificationsService) {
      if (this.configService.get<string>('NODE_ENV') === 'development') return;
      throw new ServiceUnavailableException(
        'Authentication email delivery is unavailable.',
      );
    }
    const result = await this.notificationsService.sendTemplatedEmail(options);
    if (
      result.deliveryResult?.success === false ||
      (this.configService.get<string>('NODE_ENV') !== 'development' &&
        (!result.deliveryResult || result.deliveryResult.mock))
    )
      throw new ServiceUnavailableException(
        'Authentication email delivery is unavailable. Please try again later.',
      );
  }

  private async sendWelcome(user: User, vaultId: string) {
    await this.notificationsService
      ?.sendTemplatedEmail({
        to: user.email,
        userId: user.id,
        templateType: EmailTemplateType.WELCOME,
        data: {
          recipientName: user.name,
          userEmail: user.email,
          vaultId,
          dashboardUrl: getEmailAppLink('home', {}, this.configService),
        },
      })
      .catch(() =>
        this.logger.warn('Welcome notification could not be delivered.'),
      );
  }

  private developmentOtp(otp: string) {
    return this.configService.get<string>('NODE_ENV') === 'development'
      ? { developmentOtp: otp }
      : {};
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
  private generateOtp() {
    return randomInt(100000, 1000000).toString();
  }
}
