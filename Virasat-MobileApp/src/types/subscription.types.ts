export enum Feature {
  CUSTOM_CHECK_IN = 'CUSTOM_CHECK_IN',
  CUSTOM_GRACE_PERIOD = 'CUSTOM_GRACE_PERIOD',
  MULTIPLE_RECIPIENTS = 'MULTIPLE_RECIPIENTS',
  RECIPIENT_VERIFICATION = 'RECIPIENT_VERIFICATION',
  ADVANCED_RELEASE_POLICY = 'ADVANCED_RELEASE_POLICY',
  MULTIPLE_VERIFIERS = 'MULTIPLE_VERIFIERS',
  ADVANCED_ESCALATION = 'ADVANCED_ESCALATION',
  FULL_ACTIVITY_HISTORY = 'FULL_ACTIVITY_HISTORY',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  FAMILY_EMERGENCY_INSTRUCTIONS = 'FAMILY_EMERGENCY_INSTRUCTIONS',
}

export enum PlanLimit {
  TRUSTED_PERSONS = 'TRUSTED_PERSONS',
  PERSONAL_MESSAGES = 'PERSONAL_MESSAGES',
  VIDEO_MESSAGES = 'VIDEO_MESSAGES',
  VAULT_ITEMS = 'VAULT_ITEMS',
}

export enum PlanCode {
  STARTER = 'STARTER',
  SECURE = 'SECURE',
  FAMILY = 'FAMILY',
}

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  GRACE_PERIOD = 'GRACE_PERIOD',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface PlanInfo {
  id?: string;
  code: PlanCode;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
}

export interface SubscriptionInfo {
  id: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string | null;
  autoRenew: boolean;
  provider: string;
  cancelAtPeriodEnd: boolean;
}

export interface EntitlementsPayload {
  effectivePlanCode: PlanCode;
  billingAvailable: boolean;
  purchaseVerification: 'NOT_REQUIRED' | 'UNVERIFIED' | 'VERIFIED';
  plan: PlanInfo;
  subscription: SubscriptionInfo;
  entitlements: Record<Feature, boolean>;
  limits: Record<PlanLimit, number | null>;
}

export interface PlanComparisonItem {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  isActive: boolean;
  displayOrder: number;
  features: Record<Feature, boolean>;
  limits: Record<PlanLimit, number | null>;
}
