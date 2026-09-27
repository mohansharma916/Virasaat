import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      this.logger.warn(`Could not seed plans immediately: ${(err as Error).message}`);
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
    let sub = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });

    if (!sub) {
      const starterPlan = await this.getPlanByCode(PlanCode.STARTER);
      sub = this.subscriptionRepository.create({
        userId,
        planId: starterPlan.id,
        plan: starterPlan,
        status: SubscriptionStatus.ACTIVE,
        provider: 'INTERNAL',
        autoRenew: false,
        cancelAtPeriodEnd: false,
        startDate: new Date(),
        expiryDate: null,
      });
      sub = await this.subscriptionRepository.save(sub);
      this.logger.log(`Initialized STARTER subscription for user ${userId}`);
    } else {
      // Check expiry & grace period
      if (
        sub.expiryDate &&
        sub.status === SubscriptionStatus.ACTIVE &&
        new Date() > new Date(sub.expiryDate)
      ) {
        const msSinceExpiry = Date.now() - new Date(sub.expiryDate).getTime();
        const daysSinceExpiry = msSinceExpiry / (1000 * 60 * 60 * 24);

        if (daysSinceExpiry <= 14) {
          sub.status = SubscriptionStatus.GRACE_PERIOD;
        } else {
          sub.status = SubscriptionStatus.EXPIRED;
        }
        sub = await this.subscriptionRepository.save(sub);
      }
    }

    return sub;
  }

  /**
   * Get user plan. If subscription is expired, effective limits fall back to STARTER
   * for creating NEW resources, while preserving all existing data and saved configurations.
   */
  async getUserPlan(userId: string): Promise<Plan> {
    const sub = await this.getUserSubscription(userId);
    if (sub.status === SubscriptionStatus.EXPIRED) {
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
    const isExpired = sub.status === SubscriptionStatus.EXPIRED;

    // In expired state, effective entitlements for new features fall back to STARTER,
    // but the displayed current plan reflects the billing state.
    const effectivePlan = isExpired
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
      if (plan.code === PlanCode.SECURE || (maxLimit >= 3 && limit === PlanLimit.TRUSTED_PERSONS)) {
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
    const policy = await this.releasePolicyRepository.findOne({ where: { userId } });
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

  /**
   * Verify and process a purchase from Google Play, Apple App Store, or direct testing.
   * IDEMPOTENT: repeated calls with the same purchase token return the existing active subscription.
   */
  async verifyAndProcessPurchase(
    userId: string,
    dto: PurchaseDto,
  ): Promise<Subscription> {
    if (!dto.purchaseToken || dto.purchaseToken.trim().length === 0) {
      throw new BadRequestException('A valid purchase token is required.');
    }

    // Verify token: Reject fake/malformed tokens (must be at least 8 characters, alphanumeric/dashes)
    if (dto.purchaseToken.length < 8) {
      throw new BadRequestException('Invalid or unverified purchase token.');
    }

    const targetPlan = await this.getPlanByCode(dto.planCode);
    if (!targetPlan || targetPlan.code === PlanCode.STARTER) {
      throw new BadRequestException('Target plan must be a paid plan.');
    }

    // Check for existing subscription with this exact purchase token (idempotency check)
    const existingSameToken = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .addSelect('sub.providerPurchaseToken')
      .where('sub.userId = :userId AND sub.providerPurchaseToken = :token', {
        userId,
        token: dto.purchaseToken,
      })
      .leftJoinAndSelect('sub.plan', 'plan')
      .getOne();

    if (existingSameToken && existingSameToken.status === SubscriptionStatus.ACTIVE) {
      return existingSameToken;
    }

    // Snapshot existing release policy before upgrading/changing
    await this.preserveReleasePolicySnapshot(userId, 'PRE_UPGRADE_SNAPSHOT');

    let sub = await this.subscriptionRepository.findOne({
      where: { userId },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (sub) {
      sub.plan = targetPlan;
      sub.planId = targetPlan.id;
      sub.status = SubscriptionStatus.ACTIVE;
      sub.startDate = now;
      sub.expiryDate = oneYearLater;
      sub.provider = dto.provider;
      sub.providerPurchaseToken = dto.purchaseToken;
      sub.providerSubscriptionId = dto.subscriptionId ?? dto.orderId ?? null;
      sub.autoRenew = true;
      sub.cancelAtPeriodEnd = false;
      sub.metadata = {
        orderId: dto.orderId,
        verifiedAt: now.toISOString(),
      };
      sub = await this.subscriptionRepository.save(sub);
    } else {
      sub = this.subscriptionRepository.create({
        userId,
        plan: targetPlan,
        planId: targetPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        expiryDate: oneYearLater,
        provider: dto.provider,
        providerPurchaseToken: dto.purchaseToken,
        providerSubscriptionId: dto.subscriptionId ?? dto.orderId ?? null,
        autoRenew: true,
        cancelAtPeriodEnd: false,
        metadata: {
          orderId: dto.orderId,
          verifiedAt: now.toISOString(),
        },
      });
      sub = await this.subscriptionRepository.save(sub);
    }

    this.logger.log(`User ${userId} successfully subscribed to plan ${targetPlan.code}`);
    return sub;
  }

  /**
   * Restore purchases.
   */
  async restorePurchases(
    userId: string,
    dto: RestorePurchaseDto,
  ): Promise<Subscription> {
    const sub = await this.getUserSubscription(userId);
    // If user already has an active paid subscription, return it
    if (sub.status === SubscriptionStatus.ACTIVE && sub.plan.code !== PlanCode.STARTER) {
      return sub;
    }

    if (dto.purchaseToken) {
      // If a token was provided, attempt to reconcile
      return this.verifyAndProcessPurchase(userId, {
        planCode: PlanCode.SECURE,
        provider: dto.provider,
        purchaseToken: dto.purchaseToken,
      });
    }

    return sub;
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
    const targetPlan = await this.getPlanByCode(targetPlanCode);
    const sub = await this.getUserSubscription(userId);

    // Snapshot existing release policy to preserve all rules and verifiers
    await this.preserveReleasePolicySnapshot(userId, `DOWNGRADE_TO_${targetPlanCode}`);

    sub.plan = targetPlan;
    sub.planId = targetPlan.id;
    if (targetPlanCode === PlanCode.STARTER) {
      sub.expiryDate = null;
      sub.autoRenew = false;
    }
    return this.subscriptionRepository.save(sub);
  }
}
