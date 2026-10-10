jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { PlanEntitlementService } from './plan-entitlement.service';
import {
  DEFAULT_PLANS,
  PlanCode,
  SubscriptionStatus,
} from './subscription.constants';
import { Subscription } from './entities/subscription.entity';
import { DowngradeDto } from './dto/downgrade.dto';

function fixture() {
  const plans = DEFAULT_PLANS.map((plan) => ({ ...plan, id: plan.code }));
  const subscriptions = new Map<string, any>();
  const snapshots: any[] = [];
  const policies = new Map<string, any>();
  let nextId = 0;
  const repository = {
    findOne: jest.fn(async ({ where }: any) =>
      structuredClone(subscriptions.get(where.userId) ?? null),
    ),
    create: jest.fn((value: any) => ({
      id: `subscription-${++nextId}`,
      ...value,
    })),
    save: jest.fn(async (value: any) => {
      subscriptions.set(value.userId, structuredClone(value));
      return value;
    }),
    manager: {} as any,
  };
  let tail = Promise.resolve();
  repository.manager.transaction = async (run: any) => {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await run({
        query: jest.fn(),
        getRepository: (entity: unknown) => {
          if (entity !== Subscription) throw new Error('Unexpected repository');
          return repository;
        },
      });
    } finally {
      release();
    }
  };
  const service = new PlanEntitlementService(
    {
      findOne: jest.fn(
        async ({ where }: any) =>
          plans.find((plan) => plan.code === where.code) ?? null,
      ),
    } as never,
    repository as never,
    {
      create: (value: any) => value,
      save: jest.fn(async (value: any) => {
        snapshots.push(value);
        return value;
      }),
    } as never,
    {
      findOne: jest.fn(
        async ({ where }: any) => policies.get(where.userId) ?? null,
      ),
    } as never,
  );
  const seed = (
    userId: string,
    code: PlanCode,
    overrides: Record<string, unknown> = {},
  ) => {
    const value = {
      id: `subscription-${++nextId}`,
      userId,
      plan: plans.find((plan) => plan.code === code),
      planId: code,
      status: SubscriptionStatus.ACTIVE,
      expiryDate: new Date(Date.now() + 86400000),
      providerVerifiedAt: new Date(),
      ...overrides,
    };
    subscriptions.set(userId, value);
    return value;
  };
  return { service, repository, subscriptions, policies, snapshots, seed };
}

describe('Subscription security and lifecycle', () => {
  it('initializes exactly one Starter subscription under concurrent reads', async () => {
    const { service, subscriptions } = fixture();
    const result = await Promise.all(
      Array.from({ length: 10 }, () => service.getUserSubscription('new-user')),
    );
    expect(new Set(result.map((sub) => sub.id)).size).toBe(1);
    expect(subscriptions.size).toBe(1);
    expect(result[0]).toMatchObject({
      plan: { code: PlanCode.STARTER },
      providerVerifiedAt: null,
    });
  });

  it.each(['abcdefgh', 'previously-accepted-token', ''])(
    'rejects unverified purchase token %s without subscription writes',
    async (purchaseToken) => {
      const { service, repository } = fixture();
      await expect(
        service.verifyAndProcessPurchase('buyer', {
          planCode: PlanCode.FAMILY,
          provider: 'UNTRUSTED',
          purchaseToken,
        }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(repository.save).not.toHaveBeenCalled();
    },
  );

  it('does not grant premium access to an existing pre-fix fabricated subscription', async () => {
    const { service, seed } = fixture();
    seed('buyer', PlanCode.FAMILY, {
      providerVerifiedAt: null,
      expiryDate: null,
      metadata: { verifiedAt: new Date().toISOString() },
    });
    const payload = await service.getUserEntitlementsPayload('buyer');
    expect(payload.plan.code).toBe(PlanCode.FAMILY);
    expect(payload.effectivePlanCode).toBe(PlanCode.STARTER);
    expect(payload.purchaseVerification).toBe('UNVERIFIED');
    expect(payload.entitlements.CUSTOM_CHECK_IN).toBe(false);
    expect(payload.billingAvailable).toBe(false);
  });

  it.each([PlanCode.SECURE, PlanCode.FAMILY])(
    'cannot upgrade Starter through downgrade to %s',
    async (planCode) => {
      const { service } = fixture();
      await expect(
        service.downgradeSubscription('starter', planCode),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect((await service.getUserSubscription('starter')).plan.code).toBe(
        PlanCode.STARTER,
      );
    },
  );

  it('rejects same-tier changes and malformed downgrade DTOs', async () => {
    const { service, seed } = fixture();
    seed('buyer', PlanCode.SECURE);
    await expect(
      service.downgradeSubscription('buyer', PlanCode.SECURE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      await validate(Object.assign(new DowngradeDto(), { planCode: 'ADMIN' })),
    ).not.toHaveLength(0);
    expect(await validate(new DowngradeDto())).not.toHaveLength(0);
  });

  it('downgrades only to a lower tier and preserves the saved release policy', async () => {
    const { service, seed, policies, snapshots } = fixture();
    const original = seed('buyer', PlanCode.FAMILY);
    const policy = {
      id: 'policy',
      userId: 'buyer',
      version: 3,
      verificationRequired: true,
      escalationConfig: { requiredVerifiers: ['one', 'two'] },
    };
    policies.set('buyer', policy);
    const downgraded = await service.downgradeSubscription(
      'buyer',
      PlanCode.SECURE,
    );
    expect(downgraded).toMatchObject({
      id: original.id,
      plan: { code: PlanCode.SECURE },
      expiryDate: original.expiryDate,
      providerVerifiedAt: original.providerVerifiedAt,
    });
    expect(snapshots[0]).toMatchObject({
      policyVersion: 3,
      escalationConfig: policy.escalationConfig,
    });
    expect(policies.get('buyer')).toEqual(policy);
  });

  it('transitions grace to expired after fourteen days and falls back to Starter entitlements', async () => {
    const { service, seed } = fixture();
    seed('buyer', PlanCode.FAMILY, {
      status: SubscriptionStatus.GRACE_PERIOD,
      expiryDate: new Date(Date.now() - 15 * 86400000),
    });
    expect((await service.getUserSubscription('buyer')).status).toBe(
      SubscriptionStatus.EXPIRED,
    );
    expect((await service.getUserPlan('buyer')).code).toBe(PlanCode.STARTER);
  });

  it('retains verified premium access during the defined grace period', async () => {
    const { service, seed } = fixture();
    seed('buyer', PlanCode.SECURE, {
      expiryDate: new Date(Date.now() - 86400000),
    });
    expect((await service.getUserSubscription('buyer')).status).toBe(
      SubscriptionStatus.GRACE_PERIOD,
    );
    expect((await service.getUserPlan('buyer')).code).toBe(PlanCode.SECURE);
  });

  it.each([
    SubscriptionStatus.PENDING,
    SubscriptionStatus.PAYMENT_FAILED,
    SubscriptionStatus.CANCELLED,
  ])('denies paid access in %s state', async (status) => {
    const { service, seed } = fixture();
    seed('buyer', PlanCode.FAMILY, { status });
    expect((await service.getUserPlan('buyer')).code).toBe(PlanCode.STARTER);
  });

  it('refreshes state without claiming store restoration and refuses supplied store credentials', async () => {
    const { service, repository } = fixture();
    expect(
      (await service.restorePurchases('starter', { provider: 'GOOGLE_PLAY' }))
        .plan.code,
    ).toBe(PlanCode.STARTER);
    repository.save.mockClear();
    await expect(
      service.restorePurchases('starter', {
        provider: 'GOOGLE_PLAY',
        purchaseToken: 'abcdefgh',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      service.restorePurchases('starter', {
        provider: 'APPLE',
        originalTransactionId: 'fake',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
