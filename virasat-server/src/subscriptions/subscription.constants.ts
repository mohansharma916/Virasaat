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

export interface PlanFeatureConfig {
  [Feature.CUSTOM_CHECK_IN]: boolean;
  [Feature.CUSTOM_GRACE_PERIOD]: boolean;
  [Feature.MULTIPLE_RECIPIENTS]: boolean;
  [Feature.RECIPIENT_VERIFICATION]: boolean;
  [Feature.ADVANCED_RELEASE_POLICY]: boolean;
  [Feature.MULTIPLE_VERIFIERS]: boolean;
  [Feature.ADVANCED_ESCALATION]: boolean;
  [Feature.FULL_ACTIVITY_HISTORY]: boolean;
  [Feature.PRIORITY_SUPPORT]: boolean;
  [Feature.FAMILY_EMERGENCY_INSTRUCTIONS]: boolean;
}

export interface PlanLimitConfig {
  [PlanLimit.TRUSTED_PERSONS]: number | null;
  [PlanLimit.PERSONAL_MESSAGES]: number | null;
  [PlanLimit.VIDEO_MESSAGES]: number | null;
  [PlanLimit.VAULT_ITEMS]: number | null;
}

export interface PlanSeedDefinition {
  code: PlanCode;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  isActive: boolean;
  displayOrder: number;
  features: PlanFeatureConfig;
  limits: PlanLimitConfig;
}

export const DEFAULT_PLANS: PlanSeedDefinition[] = [
  {
    code: PlanCode.STARTER,
    name: 'Starter',
    description: 'Start building your digital legacy.',
    price: 0,
    currency: 'INR',
    billingPeriod: 'FREE',
    isActive: true,
    displayOrder: 1,
    features: {
      [Feature.CUSTOM_CHECK_IN]: false,
      [Feature.CUSTOM_GRACE_PERIOD]: false,
      [Feature.MULTIPLE_RECIPIENTS]: false,
      [Feature.RECIPIENT_VERIFICATION]: false,
      [Feature.ADVANCED_RELEASE_POLICY]: false,
      [Feature.MULTIPLE_VERIFIERS]: false,
      [Feature.ADVANCED_ESCALATION]: false,
      [Feature.FULL_ACTIVITY_HISTORY]: false,
      [Feature.PRIORITY_SUPPORT]: false,
      [Feature.FAMILY_EMERGENCY_INSTRUCTIONS]: false,
    },
    limits: {
      [PlanLimit.TRUSTED_PERSONS]: 1,
      [PlanLimit.PERSONAL_MESSAGES]: 3,
      [PlanLimit.VIDEO_MESSAGES]: 1,
      [PlanLimit.VAULT_ITEMS]: null,
    },
  },
  {
    code: PlanCode.SECURE,
    name: 'Secure',
    description: 'Secure your legacy and decide exactly who receives what.',
    price: 999,
    currency: 'INR',
    billingPeriod: 'YEARLY',
    isActive: true,
    displayOrder: 2,
    features: {
      [Feature.CUSTOM_CHECK_IN]: true,
      [Feature.CUSTOM_GRACE_PERIOD]: true,
      [Feature.MULTIPLE_RECIPIENTS]: true,
      [Feature.RECIPIENT_VERIFICATION]: true,
      [Feature.ADVANCED_RELEASE_POLICY]: false,
      [Feature.MULTIPLE_VERIFIERS]: false,
      [Feature.ADVANCED_ESCALATION]: false,
      [Feature.FULL_ACTIVITY_HISTORY]: true,
      [Feature.PRIORITY_SUPPORT]: false,
      [Feature.FAMILY_EMERGENCY_INSTRUCTIONS]: false,
    },
    limits: {
      [PlanLimit.TRUSTED_PERSONS]: 3,
      [PlanLimit.PERSONAL_MESSAGES]: null,
      [PlanLimit.VIDEO_MESSAGES]: 10,
      [PlanLimit.VAULT_ITEMS]: null,
    },
  },
  {
    code: PlanCode.FAMILY,
    name: 'Family',
    description: 'Advanced protection and continuity for your family.',
    price: 2499,
    currency: 'INR',
    billingPeriod: 'YEARLY',
    isActive: true,
    displayOrder: 3,
    features: {
      [Feature.CUSTOM_CHECK_IN]: true,
      [Feature.CUSTOM_GRACE_PERIOD]: true,
      [Feature.MULTIPLE_RECIPIENTS]: true,
      [Feature.RECIPIENT_VERIFICATION]: true,
      [Feature.ADVANCED_RELEASE_POLICY]: true,
      [Feature.MULTIPLE_VERIFIERS]: true,
      [Feature.ADVANCED_ESCALATION]: true,
      [Feature.FULL_ACTIVITY_HISTORY]: true,
      [Feature.PRIORITY_SUPPORT]: true,
      [Feature.FAMILY_EMERGENCY_INSTRUCTIONS]: true,
    },
    limits: {
      [PlanLimit.TRUSTED_PERSONS]: 8,
      [PlanLimit.PERSONAL_MESSAGES]: null,
      [PlanLimit.VIDEO_MESSAGES]: 50,
      [PlanLimit.VAULT_ITEMS]: null,
    },
  },
];
