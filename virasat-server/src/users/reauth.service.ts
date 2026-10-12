import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { AuthRateLimitService } from '../auth/auth-rate-limit.service';
import { User, UserStatus } from './entities/user.entity';

export interface ReauthProof {
  currentPassword?: string;
  googleIdToken?: string;
}

// A Google token proves a recent sign-in only if it was issued just now.
const GOOGLE_REAUTH_MAX_AGE_SECONDS = 10 * 60;

/**
 * Step-up check for sensitive changes. A stolen bearer token alone is not
 * enough: the caller must also present the account password or a fresh
 * Google sign-in for the same Google account.
 */
@Injectable()
export class ReauthService {
  private googleClient?: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly rateLimiter: AuthRateLimitService,
  ) {}

  async verify(userId: string, proof: ReauthProof): Promise<void> {
    if (!proof.currentPassword && !proof.googleIdToken)
      throw new ForbiddenException({
        statusCode: 403,
        code: 'REAUTH_REQUIRED',
        message: 'Confirm your identity to make this change.',
      });
    await this.rateLimiter.consume('reauth', userId, 10, 15 * 60);
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: userId })
      .getOne();
    if (user?.status === UserStatus.ACTIVE) {
      if (
        proof.currentPassword &&
        user.passwordHash &&
        (await bcrypt.compare(proof.currentPassword, user.passwordHash))
      )
        return;
      if (
        proof.googleIdToken &&
        user.googleId &&
        (await this.isFreshGoogleSignIn(proof.googleIdToken, user.googleId))
      )
        return;
    }
    // 403, not 401: the session itself is still valid.
    throw new ForbiddenException({
      statusCode: 403,
      code: 'REAUTH_FAILED',
      message:
        'We could not confirm your identity. Check your password and try again.',
    });
  }

  private async isFreshGoogleSignIn(idToken: string, googleId: string) {
    const audience = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.googleClient ??= new OAuth2Client(audience);
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience,
      });
      const payload = ticket.getPayload();
      const issuedAt = payload?.iat ?? 0;
      return (
        payload?.sub === googleId &&
        Date.now() / 1000 - issuedAt <= GOOGLE_REAUTH_MAX_AGE_SECONDS
      );
    } catch {
      return false;
    }
  }
}
