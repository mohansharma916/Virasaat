jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (Strategy: any) =>
    class extends Strategy {
      constructor(options: any) {
        super(options, () => undefined);
      }
    },
}));
// Nest's installed JWT wrapper is ESM; exercise real JWT signing with its CJS engine.
jest.mock('@nestjs/jwt', () => ({
  JwtService: class {
    constructor(private readonly options: any) {}
    async signAsync(payload: any) {
      return require('jsonwebtoken').sign(
        payload,
        this.options.secret,
        this.options.signOptions,
      );
    }
    async verifyAsync(token: string) {
      return require('jsonwebtoken').verify(token, this.options.secret);
    }
  },
}));

import { HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailSignup } from './entities/email-signup.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { Vault } from '../vault/entities/vault.entity';

async function fixture(environment = 'production') {
  const user = {
    id: 'owner',
    name: 'Owner',
    email: 'owner@example.test',
    status: UserStatus.ACTIVE,
    passwordHash: await bcrypt.hash('old-password-fixture', 4),
    sessionVersion: 0,
    googleId: null,
  };
  const state: Record<string, any[]> = {
    users: [user],
    signups: [
      {
        id: 'signup',
        email: 'new@example.test',
        name: 'New',
        passwordHash: await bcrypt.hash('signup-password-fixture', 4),
        otpHash: await bcrypt.hash('123456', 4),
        otpExpiresAt: new Date(Date.now() + 600000),
        lastSentAt: new Date(Date.now() - 120000),
        attempts: 0,
        verified: false,
      },
    ],
    resets: [
      {
        id: 'reset',
        email: user.email,
        otpHash: await bcrypt.hash('123456', 4),
        expiresAt: new Date(Date.now() + 600000),
        createdAt: new Date(Date.now() - 120000),
        lastSentAt: new Date(Date.now() - 120000),
        attempts: 0,
        used: false,
      },
    ],
    vaults: [],
  };
  const keys = new Map<unknown, string>([
    [User, 'users'],
    [EmailSignup, 'signups'],
    [PasswordReset, 'resets'],
    [Vault, 'vaults'],
  ]);
  let tail = Promise.resolve();
  let nextId = 0;
  const locks: string[] = [];
  const failNextSave = new Set<unknown>();
  const transaction = async (run: any) => {
    let unlock: (() => void) | undefined;
    let snapshot: typeof state | undefined;
    const acquire = async () => {
      if (unlock) return;
      const previous = tail;
      tail = new Promise<void>((resolve) => {
        unlock = resolve;
      });
      await previous;
      snapshot = structuredClone(state);
    };
    const getRepository = (entity: unknown) => {
      const key = keys.get(entity)!;
      const repository = {
        async findOne(options: any) {
          if (options.lock) await acquire();
          const records = state[key].filter((row) =>
            Object.entries(options.where).every(
              ([field, value]) => row[field] === value,
            ),
          );
          if (options.order?.createdAt === 'DESC')
            records.sort(
              (a, b) =>
                new Date(b.createdAt ?? 0).getTime() -
                new Date(a.createdAt ?? 0).getTime(),
            );
          return structuredClone(records[0] ?? null);
        },
        create(value: any) {
          return { id: `created-${++nextId}`, createdAt: new Date(), ...value };
        },
        async save(value: any) {
          if (failNextSave.delete(entity))
            throw new Error('Injected database write failure');
          const index = state[key].findIndex((row) => row.id === value.id);
          if (index < 0) state[key].push(structuredClone(value));
          else state[key][index] = structuredClone(value);
          return value;
        },
        async update(where: any, changes: any) {
          for (const row of state[key])
            if (
              Object.entries(where).every(
                ([field, value]) => row[field] === value,
              )
            )
              Object.assign(row, changes);
        },
        createQueryBuilder() {
          let email = '';
          return {
            addSelect() {
              return this;
            },
            where(_sql: string, params: any) {
              email = params.email;
              return this;
            },
            setLock() {
              return this;
            },
            async getOne() {
              await acquire();
              return structuredClone(
                state[key].find((row) => row.email === email) ?? null,
              );
            },
          };
        },
      };
      return repository;
    };
    try {
      return await run({
        getRepository,
        async query(sql: string) {
          locks.push(sql);
          await acquire();
        },
      });
    } catch (error) {
      if (snapshot)
        for (const key of Object.keys(state)) state[key] = snapshot[key];
      throw error;
    } finally {
      unlock?.();
    }
  };
  const jwt = new JwtService({
    secret: 'local-security-tests-only',
    signOptions: { expiresIn: '7d' },
  });
  const config = {
    getOrThrow: (key: string) =>
      key === 'JWT_SECRET'
        ? 'local-security-tests-only'
        : 'local-google-client',
    get: (key: string) => (key === 'NODE_ENV' ? environment : undefined),
  };
  const notifications = {
    sendTemplatedEmail: jest.fn(async () => ({
      deliveryResult: { success: true, mock: false },
    })),
  };
  const limiter = { checkAccount: jest.fn(async () => undefined) };
  const users = {
    findById: async (id: string) =>
      structuredClone(state.users.find((row) => row.id === id)),
    findByEmailWithPassword: async (email: string) =>
      structuredClone(state.users.find((row) => row.email === email)),
  };
  const service = new AuthService(
    users as never,
    { findByUserId: async () => null } as never,
    jwt,
    config as never,
    { manager: { transaction } } as never,
    { manager: { transaction } } as never,
    limiter as never,
    notifications as never,
  );
  const strategy = new JwtStrategy(config as never, users as never);
  return {
    service,
    strategy,
    jwt,
    state,
    locks,
    notifications,
    limiter,
    failNextSave,
  };
}

describe('Authentication security', () => {
  it('commits only five failed OTP attempts under concurrent reset guesses', async () => {
    const { service, state, locks } = await fixture();
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        service.resetPassword(
          'owner@example.test',
          '999999',
          'new-password-fixture',
        ),
      ),
    );
    expect(state.resets[0].attempts).toBe(5);
    expect(
      results.filter(
        (result) =>
          result.status === 'rejected' &&
          result.reason.message.startsWith('Invalid verification'),
      ),
    ).toHaveLength(5);
    expect(state.users[0].sessionVersion).toBe(0);
    expect(locks).toHaveLength(20);
  });

  it('commits only five failed signup guesses under concurrent verification', async () => {
    const { service, state } = await fixture();
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () =>
        service.verifyEmail('new@example.test', '999999'),
      ),
    );
    expect(state.signups[0].attempts).toBe(5);
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(state.users).toHaveLength(1);
  });

  it('consumes a reset exactly once and revokes previously issued JWTs', async () => {
    const { service, state, jwt, strategy } = await fixture();
    const oldToken = await jwt.signAsync({
      sub: 'owner',
      email: 'owner@example.test',
      sessionVersion: 0,
    });
    expect(
      await strategy.validate(await jwt.verifyAsync(oldToken)),
    ).not.toBeNull();
    const results = await Promise.allSettled([
      service.resetPassword('owner@example.test', '123456', 'new-password-one'),
      service.resetPassword('owner@example.test', '123456', 'new-password-two'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(state.resets[0].used).toBe(true);
    expect(state.users[0].sessionVersion).toBe(1);
    expect(await strategy.validate(await jwt.verifyAsync(oldToken))).toBeNull();
    expect(
      await strategy.validate({ sub: 'owner', email: 'owner@example.test' }),
    ).toBeNull();
    const login = await service.login('owner@example.test', 'new-password-one');
    expect(
      await strategy.validate(await jwt.verifyAsync(login.accessToken)),
    ).not.toBeNull();
  });

  it('logout revokes all earlier tokens but permits a fresh login', async () => {
    const { service, state, jwt, strategy } = await fixture();
    const first = await service.login(
      'owner@example.test',
      'old-password-fixture',
    );
    await service.logout('owner');
    expect(state.users[0].sessionVersion).toBe(1);
    expect(
      await strategy.validate(await jwt.verifyAsync(first.accessToken)),
    ).toBeNull();
    const next = await service.login(
      'owner@example.test',
      'old-password-fixture',
    );
    expect(
      await strategy.validate(await jwt.verifyAsync(next.accessToken)),
    ).not.toBeNull();
  });

  it('creates a user and vault once when a signup code is replayed concurrently', async () => {
    const { service, state } = await fixture();
    const results = await Promise.allSettled([
      service.verifyEmail('new@example.test', '123456'),
      service.verifyEmail('new@example.test', '123456'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      state.users.filter((row) => row.email === 'new@example.test'),
    ).toHaveLength(1);
    expect(state.vaults).toHaveLength(1);
    expect(state.signups[0].verified).toBe(true);
  });

  it('rolls back code consumption and password changes if saving fails', async () => {
    const { service, state, failNextSave } = await fixture();
    const oldHash = state.users[0].passwordHash;
    failNextSave.add(PasswordReset);
    await expect(
      service.resetPassword(
        'owner@example.test',
        '123456',
        'new-password-fixture',
      ),
    ).rejects.toThrow('Injected database write failure');
    expect(state.resets[0].used).toBe(false);
    expect(state.users[0].sessionVersion).toBe(0);
    expect(state.users[0].passwordHash).toBe(oldHash);
  });

  it('serializes password-reset resends, enforces cooldown and invalidates the older code', async () => {
    const { service, state, notifications } = await fixture();
    const results = await Promise.allSettled([
      service.forgotPassword('owner@example.test'),
      service.resendPasswordReset('owner@example.test'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = results.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(HttpException);
    expect(rejected.reason.getStatus()).toBe(429);
    expect(state.resets.filter((row) => !row.used)).toHaveLength(1);
    expect(state.resets[0].used).toBe(true);
    const email = notifications.sendTemplatedEmail.mock.calls[0] as unknown as [
      { data: { resetUrl: string; resetCode: string } },
    ];
    expect(email[0].data.resetUrl).toContain('virasat://forgot-password');
    expect(email[0].data.resetUrl).toContain('mode=reset');
  });

  it('does not reveal OTPs or log them outside explicit development', async () => {
    const { service } = await fixture();
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const result = await service.register(
        'different@example.test',
        'New User',
        'password-fixture',
      );
      expect(result).not.toHaveProperty('developmentOtp');
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it('refuses mock email success in production and refuses suspended-user login', async () => {
    const { service, state, notifications } = await fixture();
    notifications.sendTemplatedEmail.mockResolvedValueOnce({
      deliveryResult: { success: true, mock: true },
    });
    await expect(
      service.forgotPassword('owner@example.test'),
    ).rejects.toMatchObject({ status: 503 });
    state.users[0].status = UserStatus.SUSPENDED;
    await expect(
      service.login('owner@example.test', 'old-password-fixture'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
