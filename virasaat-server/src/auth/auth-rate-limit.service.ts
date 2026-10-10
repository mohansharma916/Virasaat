import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthRateLimit } from './entities/auth-rate-limit.entity';

export type AuthAction =
  | 'login'
  | 'google'
  | 'signup-send'
  | 'signup-verify'
  | 'reset-send'
  | 'reset-verify';

const ACCOUNT_LIMITS: Record<AuthAction, [number, number]> = {
  login: [10, 15 * 60],
  google: [30, 15 * 60],
  'signup-send': [5, 60 * 60],
  'signup-verify': [20, 15 * 60],
  'reset-send': [5, 60 * 60],
  'reset-verify': [20, 15 * 60],
};

/** PostgreSQL enforces limits across concurrent requests, restarts and API replicas. */
@Injectable()
export class AuthRateLimitService {
  private lastCleanupAt = 0;

  constructor(
    @InjectRepository(AuthRateLimit)
    private readonly repository: Repository<AuthRateLimit>,
  ) {}

  async checkAccount(action: AuthAction, email: string): Promise<void> {
    const [limit, seconds] = ACCOUNT_LIMITS[action];
    await this.consume(`account:${action}`, email, limit, seconds);
  }

  async consume(
    namespace: string,
    identity: string,
    limit: number,
    seconds: number,
  ): Promise<void> {
    const key = createHash('sha256')
      .update(`${namespace}:${identity}`)
      .digest('hex');
    const rows: { count: number; expiresAt: Date | string }[] =
      await this.repository.query(
        `INSERT INTO "auth_rate_limits" ("key", "count", "expiresAt")
       VALUES ($1, 1, NOW() + $2 * INTERVAL '1 second')
       ON CONFLICT ("key") DO UPDATE SET
         "count" = CASE WHEN "auth_rate_limits"."expiresAt" <= NOW()
           THEN 1 ELSE "auth_rate_limits"."count" + 1 END,
         "expiresAt" = CASE WHEN "auth_rate_limits"."expiresAt" <= NOW()
           THEN NOW() + $2 * INTERVAL '1 second' ELSE "auth_rate_limits"."expiresAt" END
       RETURNING "count", "expiresAt"`,
        [key, seconds],
      );
    const bucket = rows[0];
    if (!bucket || bucket.count > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'AUTH_RATE_LIMITED',
          message: 'Too many authentication requests. Please try again later.',
          retryAfterSeconds: bucket
            ? Math.max(
                1,
                Math.ceil(
                  (new Date(bucket.expiresAt).getTime() - Date.now()) / 1000,
                ),
              )
            : seconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (Date.now() - this.lastCleanupAt > 5 * 60 * 1000) {
      this.lastCleanupAt = Date.now();
      await this.repository.query(
        'DELETE FROM "auth_rate_limits" WHERE "expiresAt" < NOW() - INTERVAL \'1 day\'',
      );
    }
  }
}
