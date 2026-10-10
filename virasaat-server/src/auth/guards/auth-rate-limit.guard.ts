import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthRateLimitService } from '../auth-rate-limit.service';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(private readonly limiter: AuthRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      ip?: string;
      socket?: { remoteAddress?: string };
    }>();
    const handler = context.getHandler().name;
    if (request.method !== 'POST' || handler === 'logout') return true;
    const sendsEmail = [
      'register',
      'resendVerification',
      'forgotPassword',
      'resendPasswordReset',
    ].includes(handler);
    await this.limiter.consume(
      `ip:${handler}`,
      request.ip || request.socket?.remoteAddress || 'unknown',
      sendsEmail ? 30 : 60,
      sendsEmail ? 60 * 60 : 15 * 60,
    );
    return true;
  }
}
