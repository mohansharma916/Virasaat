jest.mock('../../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class JwtAuthGuard {},
}));
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmailDiagnosticsGuard } from './email-diagnostics.guard';
import { EmailPreviewController } from './email-preview.controller';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { getEmailAppLink } from './email-links';

function context(
  token?: string,
  to = 'diagnostics@example.test',
  method = 'POST',
) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        headers: { 'x-email-diagnostics-token': token },
        body: { to },
      }),
    }),
  };
}

describe('Development email diagnostics', () => {
  const settings = {
    NODE_ENV: 'development',
    EMAIL_DIAGNOSTICS_TOKEN: 'synthetic-admin-token',
    EMAIL_DIAGNOSTICS_TO: 'diagnostics@example.test',
  };
  const guard = (values: Record<string, string> = settings) =>
    new EmailDiagnosticsGuard({ get: (key: string) => values[key] } as never);

  it('requires both diagnostic authorization and an authenticated JWT', () => {
    expect(Reflect.getMetadata('__guards__', EmailPreviewController)).toEqual([
      EmailDiagnosticsGuard,
      JwtAuthGuard,
    ]);
    expect(() => guard().canActivate(context() as never)).toThrow(
      ForbiddenException,
    );
    expect(() => guard().canActivate(context('wrong-token') as never)).toThrow(
      ForbiddenException,
    );
  });

  it.each(['production', 'test', ''])(
    'refuses diagnostic access in %s environment even with the correct secret',
    (NODE_ENV) => {
      expect(() =>
        guard({ ...settings, NODE_ENV }).canActivate(
          context(settings.EMAIL_DIAGNOSTICS_TOKEN) as never,
        ),
      ).toThrow(NotFoundException);
    },
  );

  it('limits test delivery to the configured destination and refuses unconfigured diagnostics', () => {
    expect(() =>
      guard().canActivate(
        context(
          settings.EMAIL_DIAGNOSTICS_TOKEN,
          'arbitrary@example.test',
        ) as never,
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard({ NODE_ENV: 'development' }).canActivate(
        context('anything') as never,
      ),
    ).toThrow(ForbiddenException);
    expect(
      guard().canActivate(context(settings.EMAIL_DIAGNOSTICS_TOKEN) as never),
    ).toBe(true);
  });

  it('builds implemented deep links and refuses unsafe configured protocols', () => {
    expect(getEmailAppLink('home')).toBe('virasat://home');
    const recovery = new URL(
      getEmailAppLink('recovery', {
        email: 'owner@example.test',
        mode: 'reset',
      }),
    );
    expect(recovery.hostname).toBe('forgot-password');
    expect(recovery.searchParams.get('email')).toBe('owner@example.test');
    expect(() =>
      getEmailAppLink('home', {}, {
        get: () => 'javascript:alert(1)',
      } as never),
    ).toThrow('must use HTTPS');
  });
});
