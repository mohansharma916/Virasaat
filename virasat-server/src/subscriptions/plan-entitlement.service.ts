import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { ReleasePolicySnapshot } from './entities/release-policy-snapshot.entity';
import {
  DEFAULT_PLANS,
  Feature,
  PlanCode,
  PlanLimit,
  SubscriptionStatus,
} from './subscription.constants';
import { PurchaseDto } from './dto/purchase.dto';
import { RestorePurchaseDto } from './dto/restore-purchase.dto';
import { ReleasePolicy } from '../release/entities/release-policy.entity';
import {
  GooglePlayVerifier,
  PLAY_PRODUCT_IDS,
  PlaySubscription,
  hashPurchaseToken,
  planForProduct,
  playAccountRef,
} from './google-play.verifier';

@Injectable()
export class PlanEntitlementService implements OnModuleInit {
  private readonly logger = new Logger(PlanEntitlementService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(ReleasePolicySnapshot)
    private readonly snapshotRepository: Repository<ReleasePolicySnapshot>,

    @InjectRepository(ReleasePolicy)
    private readonly releasePolicyRepository: Repository<ReleasePolicy>,
      @Optional()
    private readonly playVerifier?: GooglePlayVerifier,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  /**
   * Seed default plans (STARTER, SECURE, FAMILY) if they do not exist.
   */
  async seedDefaultPlans(): Promise<void> {
    try {
      for (const def of DEFAULT_PLANS) {
        let plan = await this.planRepository.findOne({
          where: { code: def.code },
        });

        if (!plan) {
          plan = this.planRepository.create({
            code: def.code,
            name: def.name,
            description: def.description,
            price: def.price,
            currency: def.currency,
            billingPeriod: def.billingPeriod,
            isActive: def.isActive,
            displayOrder: def.displayOrder,
            features: def.features,
            limits: def.limits,
          });
          await this.planRepository.save(plan);
          this.logger.log(`Seeded plan ${def.code}`);
        }
      }
    } catch (err) {
      this.logger.warn(
        `Could not seed plans immediately: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Get all active public plans for plan comparison screens.
   */
  async getPublicPlans(): Promise<Plan[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get plan by code.
   */
  async getPlanByCode(code: PlanCode): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { code } });
    if (!plan) {
      throw new NotFoundException(`Plan with code ${code} not found`);
    }
    return plan;
  }

  /**
   * Get or automatically initialize a user's subscription.
   * If a user doesn't have a subscription (new user or legacy backfill),
   * they automatically receive an ACTIVE subscription on STARTER.
   */
  async getUserSubscription(userId: string): Promise<Subscription> {
    return this.withSubscriptionLock(userId, (manager) =>
      this.getOrCreateUserSubscription(
        userId,
        manager.getRepository(Subscription),
      ),
    );
  }

  private async getOrCreateUserSubscription(
    userId: string,
    repository: Repository<Subscription>,
  ): Promise<Subscription> {
    let sub = await repository.findOne({
      where: { userId },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });
    if (!sub) {
      const starterPlan = await this.getPlanByCode(PlanCode.STARTER);
      sub = await repository.save(
        repository.create({
          userId,
          planId: starterPlan.id,
          plan: starterPlan,
          status: SubscriptionStatus.ACTIVE,
          provider: 'INTERNAL',
          autoRenew: false,
          cancelAtPeriodEnd: false,
          startDate: new Date(),
          expiryDate: null,
          providerVerifiedAt: null,
        }),
      );
    } else if (
      sub.expiryDate &&
      [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD].includes(
        sub.status,
      )
    ) {
      const daysSinceExpiry =
        (Date.now() - new Date(sub.expiryDate).getTime()) / 86400000;
      const nextStatus =
        daysSinceExpiry > 14
          ? SubscriptionStatus.EXPIRED
          : daysSinceExpiry > 0
            ? SubscriptionStatus.GRACE_PERIOD
            : SubscriptionStatus.ACTIVE;
      if (nextStatus !== sub.status) {
        sub.status = nextStatus;
        sub = await repository.save(sub);
      }
    }
    return sub;
  }

  private withSubscriptionLock<T>(
    userId: string,
    run: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.subscriptionRepository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `subscription:${userId}`,
      ]);
      return run(manager);
    });
  }

  private hasPaidAccess(sub: Subscription): boolean {
    return Boolean(
      sub.providerVerifiedAt &&
      sub.expiryDate &&
      [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD].includes(
        sub.status,
      ),
    );
  }

  /**
   * Get user plan. If subscription is expired, effective limits fall back to STARTER
   * for creating NEW resources, while preserving all existing data and saved configurations.
   */
  async getUserPlan(userId: string): Promise<Plan> {
    const sub = await this.getUserSubscription(userId);
    if (sub.plan.code !== PlanCode.STARTER && !this.hasPaidAccess(sub)) {
      return this.getPlanByCode(PlanCode.STARTER);
    }
    return sub.plan;
  }

  /**
   * Return unified subscription and entitlement payload for mobile clients.
   */
  async getUserEntitlementsPayload(userId: string) {
    const sub = await this.getUserSubscription(userId);
    const plan = sub.plan;
    const useStarterLimits =
      plan.code !== PlanCode.STARTER && !this.hasPaidAccess(sub);

    // In expired state, effective entitlements for new features fall back to STARTER,
    // but the displayed current plan reflects the billing state.
    const effectivePlan = useStarterLimits
      ? await this.getPlanByCode(PlanCode.STARTER)
      : plan;

    return {
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price: Number(plan.price),
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
      },
      subscription: {
        id: sub.id,
        status: sub.status,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        autoRenew: sub.autoRenew,
        provider: sub.provider,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      },
      effectivePlanCode: effectivePlan.code,
      billingAvailable: Boolean(this.playVerifier?.isConfigured()),
      // Passed to Google Play at checkout; ties purchases to this account.
      playAccountRef: playAccountRef(userId),
      playProductIds: PLAY_PRODUCT_IDS,
      purchaseVerification:
        plan.code === PlanCode.STARTER
          ? 'NOT_REQUIRED'
          : sub.providerVerifiedAt
            ? 'VERIFIED'
            : 'UNVERIFIED',
      entitlements: effectivePlan.features,
      limits: effectivePlan.limits,
    };
  }

  /**
   * Check whether a user is entitled to a specific boolean feature.
   */
  async canUseFeature(userId: string, feature: Feature): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    return Boolean(plan.features?.[feature]);
  }

  /**
   * Get user's limit for a given key.
   */
  async getLimit(userId: string, limit: PlanLimit): Promise<number | null> {
    const plan = await this.getUserPlan(userId);
    const val = plan.limits?.[limit];
    return val !== undefined ? val : null;
  }

  /**
   * Assert feature entitlement or throw a structured 403 ForbiddenException.
   */
  async assertFeature(userId: string, feature: Feature): Promise<void> {
    const hasFeature = await this.canUseFeature(userId, feature);
    if (!hasFeature) {
      let requiredPlan = PlanCode.SECURE;
      if (
        feature === Feature.ADVANCED_RELEASE_POLICY ||
        feature === Feature.MULTIPLE_VERIFIERS ||
        feature === Feature.ADVANCED_ESCALATION ||
        feature === Feature.PRIORITY_SUPPORT ||
        feature === Feature.FAMILY_EMERGENCY_INSTRUCTIONS
      ) {
        requiredPlan = PlanCode.FAMILY;
      }

      throw new ForbiddenException({
        statusCode: 403,
        code: 'FEATURE_NOT_AVAILABLE',
        feature,
        requiredPlan,
        message: `This feature requires the ${requiredPlan} plan. Please upgrade to unlock.`,
      });
    }
  }

  /**
   * Assert that the current usage is strictly below the user's plan limit.
   */
  async assertWithinLimit(
    userId: string,
    limit: PlanLimit,
    currentUsage: number,
  ): Promise<void> {
    const maxLimit = await this.getLimit(userId, limit);
    if (maxLimit !== null && currentUsage >= maxLimit) {
      const plan = await this.getUserPlan(userId);
      let requiredPlan = PlanCode.SECURE;
      if (
        plan.code === PlanCode.SECURE ||
        (maxLimit >= 3 && limit === PlanLimit.TRUSTED_PERSONS)
      ) {
        requiredPlan = PlanCode.FAMILY;
      }

      throw new ForbiddenException({
        statusCode: 403,
        code: 'PLAN_LIMIT_REACHED',
        feature: limit,
        current: currentUsage,
        limit: maxLimit,
        requiredPlan,
        message: `You have reached the limit of ${maxLimit} for ${limit} on your ${plan.name} plan.`,
      });
    }
  }

  /**
   * Capture an immutable snapshot of user's release policy configuration.
   * Guarantees release rules are never weakened or silently lost during downgrades or expiry.
   */
  async preserveReleasePolicySnapshot(
    userId: string,
    reason: string = 'DOWNGRADE_OR_EXPIRY_PRESERVATION',
  ): Promise<ReleasePolicySnapshot | null> {
    const policy = await this.releasePolicyRepository.findOne({
      where: { userId },
    });
    if (!policy) return null;

    const snapshot = this.snapshotRepository.create({
      userId,
      policyId: policy.id,
      policyVersion: policy.version,
      trigger: policy.trigger,
      verificationLevel: policy.verificationLevel,
      verificationRequired: policy.verificationRequired,
      escalationConfig: structuredClone(policy.escalationConfig || {}),
      snapshotReason: reason,
    });

    return this.snapshotRepository.save(snapshot);
  }

  private billingUnavailable(): never {
    throw new ServiceUnavailableException({
      statusCode: 503,
      code: 'BILLING_UNAVAILABLE',
      message:
        'Purchases are not available right now. No subscription has been changed.',
    });
  }

  private static readonly ENTITLED_STATES = new Set([
    'SUBSCRIPTION_STATE_ACTIVE',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    // Cancelled but paid until expiry.
    'SUBSCRIPTION_STATE_CANCELED',
  ]);

  /**
   * Applies a Google Play subscription to the account after verifying it with
   * Google. Nothing from the client is trusted except the purchase token.
   */
  async verifyAndProcessPurchase(
    userId: string,
    dto: PurchaseDto,
  ): Promise<Subscription> {
    if (dto.provider !== 'GOOGLE_PLAY')
      throw new BadRequestException('Only Google Play purchases are supported.');
    if (!this.playVerifier?.isConfigured()) this.billingUnavailable();
    const verified = await this.playVerifier.getSubscription(dto.purchaseToken);
    return this.applyPlaySubscription(userId, dto.purchaseToken, verified, dto.planCode);
  }

  private async applyPlaySubscription(
    userId: string,
    purchaseToken: string,
    verified: PlaySubscription | null,
    expectedPlan?: PlanCode,
  ): Promise<Subscription> {
    const line = verified?.lineItems?.[0];
    const planCode = line ? planForProduct(line.productId) : null;
    if (!verified || !line || !planCode)
      throw new BadRequestException('Google Play could not confirm this purchase.');
    if (expectedPlan && expectedPlan !== planCode)
      throw new BadRequestException('This purchase is for a different plan.');
    const ref = verified.externalAccountIdentifiers?.obfuscatedExternalAccountId;
    if (ref !== playAccountRef(userId))
      throw new ForbiddenException('This purchase belongs to a different Virasat account.');
    const expiry = line.expiryTime ? new Date(line.expiryTime) : null;
    if (
      !PlanEntitlementService.ENTITLED_STATES.has(verified.subscriptionState ?? '') ||
      !expiry ||
      expiry.getTime() <= Date.now()
    )
      throw new BadRequestException('This subscription is not active.');

    const tokenHash = hashPurchaseToken(purchaseToken);
    const saved = await this.withSubscriptionLock(userId, async (manager) => {
      const repository = manager.getRepository(Subscription);
      // A token may back exactly one Virasat account.
      const other = await repository
        .createQueryBuilder('s')
        .where("s.metadata ->> 'purchaseTokenHash' = :tokenHash AND s.userId != :userId", {
          tokenHash,
          userId,
        })
        .getOne();
      if (other) throw new ForbiddenException('This purchase is already used by another account.');
      const sub = await this.getOrCreateUserSubscription(userId, repository);
      const plan = await this.getPlanByCode(planCode);
      sub.plan = plan;
      sub.planId = plan.id;
      sub.provider = 'GOOGLE_PLAY';
      sub.providerSubscriptionId = line.productId;
      sub.providerPurchaseToken = purchaseToken;
      sub.providerVerifiedAt = new Date();
      sub.expiryDate = expiry;
      sub.autoRenew = Boolean(line.autoRenewingPlan?.autoRenewEnabled);
      sub.cancelAtPeriodEnd = verified.subscriptionState === 'SUBSCRIPTION_STATE_CANCELED';
      sub.status =
        verified.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
          ? SubscriptionStatus.GRACE_PERIOD
          : SubscriptionStatus.ACTIVE;
      sub.metadata = {
        ...(sub.metadata ?? {}),
        purchaseTokenHash: tokenHash,
        latestOrderId: verified.latestOrderId ?? null,
        testPurchase: Boolean(verified.testPurchase),
      };
      return repository.save(sub);
    });

    // Unacknowledged purchases are refunded by Google after 3 days.
    if (verified.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING')
      await this.playVerifier!.acknowledge(line.productId, purchaseToken).catch((error: Error) =>
        this.logger.error(`Purchase saved but not acknowledged yet: ${error.message}`),
      );
    return saved;
  }

  /**
   * Restore: verify a token from the device (new phone, reinstall), or
   * re-check the one already on file.
   */
  async restorePurchases(
    userId: string,
    dto: RestorePurchaseDto,
  ): Promise<Subscription> {
    const supplied = Boolean(dto.purchaseToken || dto.originalTransactionId);
    if (dto.provider !== 'GOOGLE_PLAY' || !this.playVerifier?.isConfigured()) {
      // Never accept store credentials that cannot be verified.
      if (supplied) this.billingUnavailable();
      return this.getUserSubscription(userId);
    }
    if (dto.purchaseToken)
      return this.applyPlaySubscription(
        userId,
        dto.purchaseToken,
        await this.playVerifier.getSubscription(dto.purchaseToken),
      );
    await this.reverify(userId);
    return this.getUserSubscription(userId);
  }

  /** Re-checks the stored Play subscription and records what Google says. */
  private async reverify(userId: string) {
    const stored = await this.subscriptionRepository
      .createQueryBuilder('s')
      .addSelect('s.providerPurchaseToken')
      .where('s.userId = :userId AND s.provider = :provider', { userId, provider: 'GOOGLE_PLAY' })
      .orderBy('s.createdAt', 'DESC')
      .getOne();
    if (!stored?.providerPurchaseToken || !this.playVerifier) return;
    const verified = await this.playVerifier.getSubscription(stored.providerPurchaseToken);
    const line = verified?.lineItems?.[0];
    const expiry = line?.expiryTime ? new Date(line.expiryTime) : null;
    const entitled =
      Boolean(verified && expiry && expiry.getTime() > Date.now()) &&
      PlanEntitlementService.ENTITLED_STATES.has(verified!.subscriptionState ?? '');
    await this.withSubscriptionLock(userId, async (manager) => {
      const repository = manager.getRepository(Subscription);
      const sub = await repository.findOne({ where: { id: stored.id } });
      if (!sub) return;
      sub.expiryDate = expiry ?? sub.expiryDate;
      sub.autoRenew = Boolean(line?.autoRenewingPlan?.autoRenewEnabled);
      sub.cancelAtPeriodEnd = verified?.subscriptionState === 'SUBSCRIPTION_STATE_CANCELED';
      sub.status = entitled
        ? verified!.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
          ? SubscriptionStatus.GRACE_PERIOD
          : SubscriptionStatus.ACTIVE
        : verified?.subscriptionState === 'SUBSCRIPTION_STATE_ON_HOLD'
          ? SubscriptionStatus.PAYMENT_FAILED
          : SubscriptionStatus.EXPIRED;
      sub.providerVerifiedAt = new Date();
      await repository.save(sub);
    });
    // Losing a paid plan keeps all data; only new limits fall back to Starter.
    if (!entitled) await this.preserveReleasePolicySnapshot(userId, 'SUBSCRIPTION_LAPSED');
  }

  /** Daily: re-check Play subscriptions that renew or end within 2 days. */
  @Cron('0 30 3 * * *')
  async reverifyExpiringSubscriptions() {
    if (!this.playVerifier?.isConfigured() || process.env.CHECK_IN_MONITOR === 'off') return;
    const soon = new Date(Date.now() + 2 * 86_400_000);
    const due = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.userId', 'userId')
      .where('s.provider = :provider AND s.expiryDate <= :soon', { provider: 'GOOGLE_PLAY', soon })
      .andWhere('s.status IN (:...statuses)', {
        statuses: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.GRACE_PERIOD,
          SubscriptionStatus.PAYMENT_FAILED,
        ],
      })
      .getRawMany<{ userId: string }>();
    for (const { userId } of due) {
      await this.reverify(userId).catch((error: Error) =>
        this.logger.warn(`Subscription re-check failed: ${error.message}`),
      );
    }
  }

  /**
   * Downgrade subscription non-destructively:
   * NEVER deletes user data, messages, or recipients.
   * Preserves critical release policies via immutable snapshot.
   */
  async downgradeSubscription(
    userId: string,
    targetPlanCode: PlanCode,
  ): Promise<Subscription> {
    const ranks = {
      [PlanCode.STARTER]: 0,
      [PlanCode.SECURE]: 1,
      [PlanCode.FAMILY]: 2,
    };
    if (!Object.hasOwn(ranks, targetPlanCode))
      throw new BadRequestException('Choose a valid target plan.');
    return this.withSubscriptionLock(userId, async (manager) => {
      const repository = manager.getRepository(Subscription);
      const sub = await this.getOrCreateUserSubscription(userId, repository);
      if (ranks[targetPlanCode] >= ranks[sub.plan.code])
        throw new BadRequestException(
          'The target plan must be lower than your current plan. Upgrades require verified payment.',
        );
      const targetPlan = await this.getPlanByCode(targetPlanCode);
      if (!targetPlan.isActive)
        throw new BadRequestException('The target plan is unavailable.');
      await this.preserveReleasePolicySnapshot(
        userId,
        `DOWNGRADE_TO_${targetPlanCode}`,
      );
      sub.plan = targetPlan;
      sub.planId = targetPlan.id;
      if (targetPlanCode === PlanCode.STARTER) {
        sub.status = SubscriptionStatus.ACTIVE;
        sub.expiryDate = null;
        sub.autoRenew = false;
        sub.cancelAtPeriodEnd = false;
      }
      return repository.save(sub);
    });
  }
}
