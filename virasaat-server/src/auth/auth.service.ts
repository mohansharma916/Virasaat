import {
  BadRequestException,
  ConflictException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { VaultService } from '../vault/vault.service';
import { NotificationsService } from '../notification/notifications.service';
import { EmailTemplateType } from '../notification/email/email-template.types';
import { EmailSignup } from './entities/email-signup.entity';
import { PasswordReset } from './entities/password-reset.entity';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly vaultService: VaultService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(EmailSignup)
    private readonly emailSignupRepository: Repository<EmailSignup>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    );
  }


  // ==================================================
  // EMAIL + PASSWORD SIGNUP
  // ==================================================

  async register(email: string, name: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);

    /**
     * Check whether a real account
     * already exists.
     */
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException(
        'An account already exists with this email. Please login.',
      );
    }

    /**
     * Check if there is already a
     * pending signup.
     */
    const existingSignup = await this.emailSignupRepository.findOne({
      where: {
        email: normalizedEmail,
        verified: false,
      },
    });

    /**
     * Hash password BEFORE storing.
     */
    const passwordHash = await bcrypt.hash(password, 12);

    /**
     * Generate OTP.
     */
    const otp = this.generateOtp();

    const otpHash = await bcrypt.hash(otp, 10);

    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let signup: EmailSignup;

    if (existingSignup) {
      existingSignup.name = name;
      existingSignup.passwordHash = passwordHash;
      existingSignup.otpHash = otpHash;
      existingSignup.otpExpiresAt = otpExpiresAt;
      existingSignup.attempts = 0;

      signup = await this.emailSignupRepository.save(existingSignup);
    } else {
      signup = this.emailSignupRepository.create({
        email: normalizedEmail,
        name,
        passwordHash,
        otpHash,
        otpExpiresAt,
        attempts: 0,
        verified: false,
      });

      await this.emailSignupRepository.save(signup);
    }

    /**
     * Send OTP through NotificationService.
     */
    if (this.notificationsService) {
      await this.notificationsService.sendTemplatedEmail({
        to: normalizedEmail,
        templateType: EmailTemplateType.OTP_VERIFICATION,
        data: {
          recipientName: name,
          otpCode: otp,
          expiryMinutes: 10,
          purpose: 'SIGNUP',
        },
      });
    }

    console.log(`[DEV] Email verification OTP for ${normalizedEmail}: ${otp}`);

    return {
      success: true,
      message:
        'OTP sent to your email. Please verify your email to complete signup.',

      /**
       * Development only.
       */
      ...(this.configService.get('NODE_ENV') !== 'production'
        ? {
            developmentOtp: otp,
          }
        : {}),
    };
  }

  // ==================================================
  // VERIFY EMAIL + CREATE ACCOUNT
  // ==================================================

  async verifyEmail(email: string, otp: string) {
    const normalizedEmail = this.normalizeEmail(email);

    /**
     * First check if account was
     * created between OTP requests.
     */
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('An account already exists with this email.');
    }

    const signup = await this.emailSignupRepository.findOne({
      where: {
        email: normalizedEmail,
        verified: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!signup) {
      throw new UnauthorizedException('Signup session not found or expired.');
    }

    if (signup.otpExpiresAt < new Date()) {
      throw new UnauthorizedException(
        'OTP has expired. Please request signup again.',
      );
    }

    if (signup.attempts >= 5) {
      throw new UnauthorizedException('Too many OTP attempts.');
    }

    signup.attempts += 1;

    const validOtp = await bcrypt.compare(otp, signup.otpHash);

    if (!validOtp) {
      await this.emailSignupRepository.save(signup);

      throw new UnauthorizedException('Invalid OTP.');
    }

    /**
     * OTP is valid.
     *
     * NOW create the actual account.
     */
    const user = await this.usersService.create({
      email: signup.email,
      name: signup.name,
      passwordHash: signup.passwordHash,
      emailVerified: true,
      googleId: null,
      avatar: null,
    });

    /**
     * Create user's vault.
     */
    const vault = await this.vaultService.createForUser(user.id);

    /**
     * Dispatch After Signup Welcome Email
     */
    if (this.notificationsService) {
      await this.notificationsService.sendTemplatedEmail({
        to: user.email,
        userId: user.id,
        templateType: EmailTemplateType.WELCOME,
        data: {
          recipientName: user.name,
          userEmail: user.email,
          vaultId: vault.id,
          dashboardUrl: 'https://virasaat.com/dashboard',
        },
      });
    }

    /**
     * Mark signup completed.
     */
    signup.verified = true;

    await this.emailSignupRepository.save(signup);

    /**
     * Generate JWT.
     */
    const accessToken = await this.generateToken(user);

    return {
      accessToken,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },

      vault: {
        id: vault.id,
        readinessScore: vault.readinessScore,
      },
    };
  }

  // ==================================================
  // RESEND VERIFICATION OTP
  // ==================================================

  async resendVerification(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const signup = await this.emailSignupRepository.findOne({
      where: {
        email: normalizedEmail,
        verified: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const response = {
      success: true,
      message:
        'If a verification is pending, a new code has been sent to your email.',
    };

    if (!signup) {
      return response;
    }

    const otp = this.generateOtp();
    signup.otpHash = await bcrypt.hash(otp, 10);
    signup.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    signup.attempts = 0;
    await this.emailSignupRepository.save(signup);

    if (this.notificationsService) {
      await this.notificationsService.sendTemplatedEmail({
        to: normalizedEmail,
        templateType: EmailTemplateType.OTP_VERIFICATION,
        data: {
          recipientName: signup.name,
          otpCode: otp,
          expiryMinutes: 10,
          purpose: 'SIGNUP',
        },
      });
    }

    console.log(`[DEV] Email verification OTP for ${normalizedEmail}: ${otp}`);

    return {
      ...response,
      ...(this.configService.get('NODE_ENV') !== 'production'
        ? { developmentOtp: otp }
        : {}),
    };
  }

  // ==================================================
  // EMAIL + PASSWORD LOGIN
  // ==================================================

  async login(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);

    const user =
      await this.usersService.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account does not have a password. Please use Google login.',
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const vault = await this.vaultService.findByUserId(user.id);

    const accessToken = await this.generateToken(user);

    return {
      accessToken,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },

      vault: vault
        ? {
            id: vault.id,
            readinessScore: vault.readinessScore,
          }
        : null,
    };
  }

  // ==================================================
  // GOOGLE SIGNUP / LOGIN
  // ==================================================

  async googleLogin(idToken: string) {
    /**
     * Verify Google ID token.
     */
    const ticket = await this.googleClient.verifyIdToken({
      idToken,

      audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid Google token.');
    }

    const googleId = payload.sub;

    const email = payload.email;

    if (!googleId || !email) {
      throw new UnauthorizedException('Invalid Google account.');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedException('Google email is not verified.');
    }

    const normalizedEmail = this.normalizeEmail(email);

    const name = payload.name ?? normalizedEmail.split('@')[0];

    const avatar = payload.picture ?? null;

    // ==================================================
    // CASE 1:
    // Google ID already linked
    // ==================================================

    let user = await this.usersService.findByGoogleId(googleId);

    if (user) {
      return this.loginWithUser(user);
    }

    // ==================================================
    // CASE 2:
    // Email already has a Virasat account
    // ==================================================

    user = await this.usersService.findByEmail(normalizedEmail);

    if (user) {
      /**
       * Existing email/password account.
       *
       * Since Google has verified ownership
       * of the same email, link Google to
       * the existing account.
       */
      user =
        (await this.usersService.update(user.id, {
          googleId,
          avatar: user.avatar ?? avatar,
          emailVerified: true,
        })) ?? user;

      return this.loginWithUser(user);
    }

    // ==================================================
    // CASE 3:
    // Completely new Google account
    // ==================================================

    user = await this.usersService.create({
      email: normalizedEmail,
      name,
      avatar,
      googleId,
      passwordHash: null,
      emailVerified: true,
    });

    const vault = await this.vaultService.createForUser(user.id);

    // Send Welcome Email for new Google signups
    if (this.notificationsService) {
      await this.notificationsService.sendTemplatedEmail({
        to: user.email,
        userId: user.id,
        templateType: EmailTemplateType.WELCOME,
        data: {
          recipientName: user.name,
          userEmail: user.email,
          vaultId: vault.id,
          dashboardUrl: 'https://virasaat.com/dashboard',
        },
      });
    }

    const accessToken = await this.generateToken(user);

    return {
      accessToken,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },

      vault: {
        id: vault.id,
        readinessScore: vault.readinessScore,
      },
    };
  }

  // ==================================================
  // LOGIN WITH USER
  // ==================================================

  private async loginWithUser(user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    emailVerified: boolean;
  }) {
    let vault = await this.vaultService.findByUserId(user.id);

    /**
     * Safety net in case the account
     * somehow doesn't have a vault.
     */
    if (!vault) {
      vault = await this.vaultService.createForUser(user.id);
    }

    const accessToken = await this.generateToken(user);

    return {
      accessToken,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
        emailVerified: user.emailVerified,
      },

      vault: {
        id: vault.id,
        readinessScore: vault.readinessScore,
      },
    };
  }

  // ==================================================
  // FORGOT PASSWORD / ACCOUNT RECOVERY
  // ==================================================

  /**
   * Smart password recovery strategy:
   * 1. If no account exists with this email -> return NOT_FOUND status with user-friendly guidance.
   * 2. If account was registered via Google Sign-In (no password) -> return GOOGLE_ACCOUNT status prompting Google Sign-In.
   * 3. If account has email & password -> generate secure 6-digit OTP and send via Nodemailer.
   */
  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      return {
        status: 'NOT_FOUND',
        message: 'No Virasaat account found with this email address. Please check your email or sign up.',
      };
    }

    // Check if user is a Google-only account without a local password
    if (user.googleId && !user.passwordHash) {
      return {
        status: 'GOOGLE_ACCOUNT',
        authMethod: 'GOOGLE',
        message: 'This account was created with Google Sign-In. You do not have a separate password.',
        email: user.email,
        name: user.name,
      };
    }

    // Password-based account -> generate 6-digit OTP
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Invalidate any existing unused reset OTPs for this email
    await this.passwordResetRepository.update(
      { email: normalizedEmail, used: false },
      { used: true },
    );

    const passwordReset = this.passwordResetRepository.create({
      email: normalizedEmail,
      otpHash,
      expiresAt,
      attempts: 0,
      used: false,
    });
    await this.passwordResetRepository.save(passwordReset);

    // Send password reset template via NotificationsService (Nodemailer)
    if (this.notificationsService) {
      await this.notificationsService.sendTemplatedEmail({
        to: normalizedEmail,
        templateType: EmailTemplateType.PASSWORD_RESET,
        data: {
          recipientName: user.name,
          resetCode: otp,
          expiryMinutes: 15,
          resetUrl: 'https://virasaat.com/auth/reset-password',
        },
      });
    }

    return {
      status: 'OTP_SENT',
      authMethod: 'PASSWORD',
      message: 'A 6-digit password reset code has been sent to your email.',
      email: user.email,
      developmentOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  /**
   * Verify the 6-digit reset OTP and update the user's password.
   */
  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new BadRequestException('No account found with this email.');
    }

    const resetRecord = await this.passwordResetRepository.findOne({
      where: {
        email: normalizedEmail,
        used: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!resetRecord) {
      throw new BadRequestException(
        'No active password reset request found. Please request a new code.',
      );
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new BadRequestException(
        'Password reset code has expired. Please request a new code.',
      );
    }

    if (resetRecord.attempts >= 5) {
      throw new BadRequestException(
        'Too many failed attempts. Please request a new reset code.',
      );
    }

    const isOtpValid = await bcrypt.compare(otp, resetRecord.otpHash);
    if (!isOtpValid) {
      resetRecord.attempts += 1;
      await this.passwordResetRepository.save(resetRecord);
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    // Mark reset code as used
    resetRecord.used = true;
    await this.passwordResetRepository.save(resetRecord);

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.update(user.id, {
      passwordHash,
      emailVerified: true,
    });

    // Send security alert email
    if (this.notificationsService) {
      try {
        await this.notificationsService.sendTemplatedEmail({
          to: normalizedEmail,
          userId: user.id,
          templateType: EmailTemplateType.SECURITY_ALERT,
          data: {
            recipientName: user.name,
            alertTitle: 'Password Changed',
            alertDescription:
              'Your Virasaat master account password has been successfully reset. If you did not perform this action, please contact support immediately.',
            eventTime: new Date().toUTCString(),
            deviceInfo: 'Virasaat Mobile App',
            reviewActivityUrl: 'https://virasaat.com/security',
          },
        });
      } catch (err) {
        // Notification failure shouldn't fail the password reset
      }
    }

    return {
      success: true,
      message: 'Your password has been successfully reset. Please sign in with your new password.',
    };
  }

  /**
   * Resend the password reset code.
   */
  async resendPasswordReset(email: string) {
    return this.forgotPassword(email);
  }

  // ==================================================
  // JWT
  // ==================================================

  private async generateToken(user: { id: string; email: string }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
  }

  // ==================================================
  // HELPERS
  // ==================================================

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

