import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRateLimitService } from '../auth-rate-limit.service';

const USER_RATE_LIMIT = 'userRateLimit';

interface UserRateLimitOptions {
  name: string;
  limit: number;
  seconds: number;
}

/**
 * Limits how often one signed-in account may call an expensive or
 * audit-writing route. Apply after JwtAuthGuard so the user is known.
 */
export function UserRateLimit(name: string, limit: number, seconds: number) {
  return applyDecorators(
    SetMetadata(USER_RATE_LIMIT, { name, limit, seconds }),
    UseGuards(UserRateLimitGuard),
  );
}

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: AuthRateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<UserRateLimitOptions | undefined>(
      USER_RATE_LIMIT,
      context.getHandler(),
    );
    const userId = context
      .switchToHttp()
      .getRequest<{ user?: { id?: string } }>().user?.id;
    if (!options || !userId) return true;
    await this.limiter.consume(
      `user:${options.name}`,
      userId,
      options.limit,
      options.seconds,
    );
    return true;
  }
}
