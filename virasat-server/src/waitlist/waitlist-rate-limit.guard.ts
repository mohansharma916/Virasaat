import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRateLimitService } from '../auth/auth-rate-limit.service';

/**
 * The waitlist is public and sends email, so each client address may only
 * register a few times an hour. Limits are stored in PostgreSQL and apply
 * across restarts and API replicas.
 */
@Injectable()
export class WaitlistRateLimitGuard implements CanActivate {
  constructor(private readonly limiter: AuthRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      ip?: string;
      socket?: { remoteAddress?: string };
    }>();
    if (request.method !== 'POST') return true;
    await this.limiter.consume(
      'ip:waitlist',
      request.ip || request.socket?.remoteAddress || 'unknown',
      5,
      60 * 60,
    );
    return true;
  }
}
