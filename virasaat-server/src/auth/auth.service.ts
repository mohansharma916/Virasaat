import {
  ConflictException,
  Injectable,
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

import { EmailSignup } from './entities/email-signup.entity';

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
     * TODO:
     * Send OTP through NotificationService.
     *
     * Never expose OTP in production.
     */
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
