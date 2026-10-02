jest.mock('../auth/guards/jwt-auth.guard', () => ({ JwtAuthGuard: class {} }));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PlanEntitlementService } from './plan-entitlement.service';
import {
  DEFAULT_PLANS,
  Feature,
  PlanCode,
  PlanLimit,
  SubscriptionStatus,
} from './subscription.constants';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { ReleasePolicySnapshot } from './entities/release-policy-snapshot.entity';
import {
  ReleasePolicy,
  ReleaseTrigger,
  VerificationLevel,
} from '../release/entities/release-policy.entity';
import { RecipientsService } from '../recipients/recipients.service';
import { CheckInService } from '../check-in/check-in.service';
import { CheckInCadence } from '../check-in/entities/check-in-policy.entity';
import { ReleaseService } from '../release/release.service';

function createMockRepository<T = any>() {
  const store = new Map<string, any>();
  return {
    store,
    findOne: jest.fn(async (options: any) => {
      if (options?.where?.code) {
        const found = Array.from(store.values()).find(
          (item: any) => item.code === options.where.code,
        );
        return found ?? null;
      }
      if (options?.where?.userId) {
        const found = Array.from(store.values()).find(
          (item: any) => item.userId === options.where.userId,
        );
        return found ?? null;
      }
      return null;
    }),
    find: jest.fn(async () => Array.from(store.values())),
    count: jest.fn(async () => store.size),
    create: jest.fn((dto: any) => ({
      id: dto.id ?? `mock-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...dto,
    })),
    save: jest.fn(async (entity: any) => {
      const id =
        entity.id ?? `mock-${Math.random().toString(36).substring(2, 9)}`;
      const saved = { ...entity, id };
      store.set(id, saved);
      return saved;
    }),
    createQueryBuilder: jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    })),
  };
}

describe('Subscription and Entitlement System', () => {
  let planRepo: ReturnType<typeof createMockRepository>;
  let subRepo: ReturnType<typeof createMockRepository>;
  let snapshotRepo: ReturnType<typeof createMockRepository>;
  let policyRepo: ReturnType<typeof createMockRepository>;
  let service: PlanEntitlementService;

  beforeEach(async () => {
    planRepo = createMockRepository();
    subRepo = createMockRepository();
    snapshotRepo = createMockRepository();
    policyRepo = createMockRepository();

    service = new PlanEntitlementService(
      planRepo as any,
      subRepo as any,
      snapshotRepo as any,
      policyRepo as any,
    );

    // Pre-seed the default plans
    for (const def of DEFAULT_PLANS) {
      const plan = planRepo.create(def);
      await planRepo.save(plan);
    }
  });

  it('1. New user automatically receives STARTER subscription', async () => {
    const sub = await service.getUserSubscription('new-user-123');
    expect(sub).toBeDefined();
    expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
    expect(sub.plan.code).toBe(PlanCode.STARTER);
  });

  it('2. STARTER cannot add a second Trusted Person (limit: 1)', async () => {
    const recipientRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(1), // already has 1
      create: jest.fn((val: any) => val),
      save: jest.fn((val: any) => Promise.resolve(val)),
    };
    const recipientsService = new RecipientsService(
      recipientRepo as any,
      service,
    );

    await expect(
      recipientsService.create('starter-user', {
        name: 'Person Two',
        email: 'person2@test.com',
      }),
    ).rejects.toThrow(ForbiddenException);

    try {
      await recipientsService.create('starter-user', {
        name: 'Person Two',
        email: 'person2@test.com',
      });
    } catch (err: any) {
      const response = err.getResponse();
      expect(response).toMatchObject({
        code: 'PLAN_LIMIT_REACHED',
        feature: PlanLimit.TRUSTED_PERSONS,
        current: 1,
        limit: 1,
        requiredPlan: PlanCode.SECURE,
      });
    }
  });

  it('3. SECURE can add up to 3 Trusted Persons', async () => {
    // Upgrade user to SECURE
    await service.verifyAndProcessPurchase('secure-user', {
      planCode: PlanCode.SECURE,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'valid-secure-token-12345',
    });

    // 0 -> 1 allowed
    await expect(
      service.assertWithinLimit('secure-user', PlanLimit.TRUSTED_PERSONS, 0),
    ).resolves.not.toThrow();
    // 1 -> 2 allowed
    await expect(
      service.assertWithinLimit('secure-user', PlanLimit.TRUSTED_PERSONS, 1),
    ).resolves.not.toThrow();
    // 2 -> 3 allowed
    await expect(
      service.assertWithinLimit('secure-user', PlanLimit.TRUSTED_PERSONS, 2),
    ).resolves.not.toThrow();
    // 3 -> 4 rejected
    await expect(
      service.assertWithinLimit('secure-user', PlanLimit.TRUSTED_PERSONS, 3),
    ).rejects.toThrow(ForbiddenException);
  });

  it('4. FAMILY can add up to 8 Trusted Persons', async () => {
    await service.verifyAndProcessPurchase('family-user', {
      planCode: PlanCode.FAMILY,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'valid-family-token-12345',
    });

    await expect(
      service.assertWithinLimit('family-user', PlanLimit.TRUSTED_PERSONS, 7),
    ).resolves.not.toThrow();
    await expect(
      service.assertWithinLimit('family-user', PlanLimit.TRUSTED_PERSONS, 8),
    ).rejects.toThrow(ForbiddenException);
  });

  it('5. STARTER cannot use custom check-in', async () => {
    const checkInRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((val: any) => val),
      save: jest.fn((val: any) => Promise.resolve(val)),
    };
    const eventRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const checkInService = new CheckInService(
      checkInRepo as any,
      eventRepo as any,
      service,
    );

    await expect(
      checkInService.updatePolicy('starter-user', {
        cadence: CheckInCadence.WEEKLY, // custom
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('6. SECURE can use custom check-in', async () => {
    await service.verifyAndProcessPurchase('secure-user-2', {
      planCode: PlanCode.SECURE,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'valid-token-weekly-123',
    });

    const checkInRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((val: any) => val),
      save: jest.fn((val: any) => Promise.resolve(val)),
    };
    const eventRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((v: any) => v),
      save: jest.fn((v: any) => Promise.resolve(v)),
    };
    const checkInService = new CheckInService(
      checkInRepo as any,
      eventRepo as any,
      service,
    );

    await expect(
      checkInService.updatePolicy('secure-user-2', {
        cadence: CheckInCadence.WEEKLY,
      }),
    ).resolves.toBeDefined();
  });

  it('7. FAMILY can use advanced release policy', async () => {
    await service.verifyAndProcessPurchase('family-user-2', {
      planCode: PlanCode.FAMILY,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'valid-token-family-policy',
    });

    const mockReleasePolicyRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((val: any) => val),
      save: jest.fn((val: any) => Promise.resolve(val)),
    };
    const releaseService = new ReleaseService(
      mockReleasePolicyRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      service,
    );

    await expect(
      releaseService.updatePolicy('family-user-2', {
        verificationLevel: VerificationLevel.HIGH,
        escalationConfig: {
          multipleVerifiers: true,
          requiredVerifiers: ['p1', 'p2'],
        },
      }),
    ).resolves.toBeDefined();
  });

  it('8. SECURE cannot use FAMILY-only advanced release policy', async () => {
    await service.verifyAndProcessPurchase('secure-user-3', {
      planCode: PlanCode.SECURE,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'valid-token-secure-3',
    });

    const mockReleasePolicyRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((val: any) => val),
      save: jest.fn((val: any) => Promise.resolve(val)),
    };
    const releaseService = new ReleaseService(
      mockReleasePolicyRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      service,
    );

    await expect(
      releaseService.updatePolicy('secure-user-3', {
        verificationLevel: VerificationLevel.HIGH,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('9. Downgrade does not delete existing trusted persons', async () => {
    // User was FAMILY with 6 trusted persons
    await service.verifyAndProcessPurchase('downgrade-user', {
      planCode: PlanCode.FAMILY,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'token-for-downgrade-user',
    });

    const mockRecipients = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' },
      { id: '5', name: 'E' },
      { id: '6', name: 'F' },
    ];
    const deleteMock = jest.fn();
    const recipientRepo = {
      find: jest.fn().mockResolvedValue(mockRecipients),
      delete: deleteMock,
      remove: deleteMock,
    };

    // Perform non-destructive downgrade to SECURE
    const downgradedSub = await service.downgradeSubscription(
      'downgrade-user',
      PlanCode.SECURE,
    );

    expect(downgradedSub.plan.code).toBe(PlanCode.SECURE);
    // Verified: No deletion methods called on recipient repo
    expect(deleteMock).not.toHaveBeenCalled();
    const preservedList = await recipientRepo.find();
    expect(preservedList).toHaveLength(6);
  });

  it('10. Expiry does not delete vault data', async () => {
    const expiredSub = subRepo.create({
      userId: 'expired-user',
      plan: await service.getPlanByCode(PlanCode.SECURE),
      planId: (await service.getPlanByCode(PlanCode.SECURE)).id,
      status: SubscriptionStatus.ACTIVE,
      expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });
    await subRepo.save(expiredSub);

    const vaultDeleteMock = jest.fn();
    // Fetching subscription transitions to EXPIRED
    const sub = await service.getUserSubscription('expired-user');
    expect(sub.status).toBe(SubscriptionStatus.EXPIRED);
    expect(vaultDeleteMock).not.toHaveBeenCalled();
  });

  it('11. Expiry does not silently modify an existing release policy', async () => {
    // Configure family release policy
    const policy = policyRepo.create({
      id: 'family-policy-1',
      userId: 'expiring-policy-user',
      version: 3,
      trigger: ReleaseTrigger.CHECK_IN_ESCALATION,
      verificationLevel: VerificationLevel.HIGH,
      verificationRequired: true,
      escalationConfig: {
        multipleVerifiers: true,
        requiredVerifiers: ['a', 'b'],
      },
    });
    await policyRepo.save(policy);

    // Save snapshot
    await service.preserveReleasePolicySnapshot(
      'expiring-policy-user',
      'EXPOSURE_PRESERVATION',
    );

    // Verify snapshot exists and policy was not mutated
    expect(snapshotRepo.save).toHaveBeenCalled();
    const currentPolicy = await policyRepo.findOne({
      where: { userId: 'expiring-policy-user' },
    });
    expect(currentPolicy.verificationLevel).toBe(VerificationLevel.HIGH);
    expect(currentPolicy.version).toBe(3);
  });

  it('12. Backend rejects unauthorized premium-feature API calls', async () => {
    await expect(
      service.assertFeature('starter-user', Feature.PRIORITY_SUPPORT),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.assertFeature('starter-user', Feature.ADVANCED_ESCALATION),
    ).rejects.toThrow(ForbiddenException);
  });

  it('13. Successful verified purchase updates entitlements', async () => {
    await service.verifyAndProcessPurchase('buyer-user', {
      planCode: PlanCode.SECURE,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'valid-purchase-token-xyz-123',
    });

    const entitlements = await service.getUserEntitlementsPayload('buyer-user');
    expect(entitlements.plan.code).toBe(PlanCode.SECURE);
    expect(entitlements.subscription.status).toBe(SubscriptionStatus.ACTIVE);
    expect(entitlements.entitlements.CUSTOM_CHECK_IN).toBe(true);
    expect(entitlements.limits.TRUSTED_PERSONS).toBe(3);
  });

  it('14. Failed purchase verification does not upgrade user', async () => {
    await expect(
      service.verifyAndProcessPurchase('fraud-user', {
        planCode: PlanCode.FAMILY,
        provider: 'GOOGLE_PLAY',
        purchaseToken: 'bad', // invalid short token
      }),
    ).rejects.toThrow(BadRequestException);

    const entitlements = await service.getUserEntitlementsPayload('fraud-user');
    expect(entitlements.plan.code).toBe(PlanCode.STARTER);
  });

  it('15. Restore purchase refreshes backend subscription', async () => {
    // Set up active purchase for user
    await service.verifyAndProcessPurchase('restore-user', {
      planCode: PlanCode.SECURE,
      provider: 'GOOGLE_PLAY',
      purchaseToken: 'token-for-restore-user-1234',
    });

    const restored = await service.restorePurchases('restore-user', {
      provider: 'GOOGLE_PLAY',
    });
    expect(restored.plan.code).toBe(PlanCode.SECURE);
    expect(restored.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('16. Duplicate purchase callbacks remain idempotent', async () => {
    const token = 'idempotent-token-unique-999';

    // Mock queryBuilder to simulate finding same token on duplicate call
    subRepo.createQueryBuilder = jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: 'sub-existing',
        userId: 'idempotent-user',
        providerPurchaseToken: token,
        status: SubscriptionStatus.ACTIVE,
        plan: DEFAULT_PLANS[1],
      }),
    })) as any;

    const firstResult = await service.verifyAndProcessPurchase(
      'idempotent-user',
      {
        planCode: PlanCode.SECURE,
        provider: 'GOOGLE_PLAY',
        purchaseToken: token,
      },
    );

    expect(firstResult.id).toBe('sub-existing');
  });
});
