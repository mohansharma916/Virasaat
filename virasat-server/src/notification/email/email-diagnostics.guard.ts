import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class EmailDiagnosticsGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get<string>('NODE_ENV') !== 'development')
      throw new NotFoundException();
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, unknown>;
      method: string;
      body?: { to?: string };
    }>();
    const expected = this.config.get<string>('EMAIL_DIAGNOSTICS_TOKEN');
    const supplied = request.headers['x-email-diagnostics-token'];
    if (!expected || typeof supplied !== 'string')
      throw new ForbiddenException('Email diagnostics are disabled.');
    const a = Buffer.from(expected);
    const b = Buffer.from(supplied);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new ForbiddenException('Email diagnostics access denied.');
    if (request.method === 'POST') {
      const destination = this.config
        .get<string>('EMAIL_DIAGNOSTICS_TO')
        ?.trim()
        .toLowerCase();
      if (
        !destination ||
        typeof request.body?.to !== 'string' ||
        request.body.to.trim().toLowerCase() !== destination
      ) {
        throw new ForbiddenException(
          'Test email is restricted to the configured diagnostic destination.',
        );
      }
    }
    return true;
  }
}
