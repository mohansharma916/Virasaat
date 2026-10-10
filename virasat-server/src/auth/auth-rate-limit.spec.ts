jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';

describe('Authentication rate limiting', () => {
  it('shares a persistent hashed bucket across service instances and rejects requests over the account limit', async () => {
    let count = 0;
    const query = jest.fn(async (sql: string) =>
      sql.startsWith('DELETE')
        ? []
        : [{ count: ++count, expiresAt: new Date(Date.now() + 60000) }],
    );
    const first = new AuthRateLimitService({ query } as never);
    const second = new AuthRateLimitService({ query } as never);
    for (let index = 0; index < 10; index++)
      await (index % 2 ? first : second).checkAccount(
        'login',
        'owner@example.test',
      );
    await expect(
      second.checkAccount('login', 'owner@example.test'),
    ).rejects.toMatchObject({ status: 429 });
    const keys = query.mock.calls
      .filter(([sql]) => sql.startsWith('INSERT'))
      .map((call) => (call as unknown as [string, [string, number]])[1][0]);
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(keys[0]).not.toContain('owner');
  });

  it('propagates database failures instead of allowing authentication without limits', async () => {
    const service = new AuthRateLimitService({
      query: jest
        .fn()
        .mockRejectedValue(new Error('rate-limit store unavailable')),
    } as never);
    await expect(
      service.checkAccount('reset-send', 'owner@example.test'),
    ).rejects.toThrow('rate-limit store unavailable');
  });

  it('limits public POSTs by the actual peer IP and leaves protected profile/logout routes usable', async () => {
    const limiter = { consume: jest.fn(async () => undefined) };
    const guard = new AuthRateLimitGuard(limiter as never);
    const context = (method: string, name: string) => ({
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          ip: '127.0.0.1',
          headers: { 'x-forwarded-for': 'attacker-controlled' },
        }),
      }),
      getHandler: () => ({ name }),
    });
    await guard.canActivate(context('POST', 'forgotPassword') as never);
    expect(limiter.consume).toHaveBeenCalledWith(
      'ip:forgotPassword',
      '127.0.0.1',
      30,
      3600,
    );
    limiter.consume.mockClear();
    await guard.canActivate(context('GET', 'me') as never);
    await guard.canActivate(context('POST', 'logout') as never);
    expect(limiter.consume).not.toHaveBeenCalled();
  });
});
