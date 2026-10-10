-- Subscriptions & Plan Entitlement Migration for Virasat
-- Generated: 2026-09-27

-- 1. Create plan_code enum if it does not exist
DO $$ BEGIN
    CREATE TYPE "plans_code_enum" AS ENUM('STARTER', 'SECURE', 'FAMILY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create subscription_status enum if it does not exist
DO $$ BEGIN
    CREATE TYPE "subscriptions_status_enum" AS ENUM('PENDING', 'ACTIVE', 'PAYMENT_FAILED', 'GRACE_PERIOD', 'CANCELLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create plans table
CREATE TABLE IF NOT EXISTS "plans" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" "plans_code_enum" UNIQUE NOT NULL,
    "name" character varying NOT NULL,
    "description" text NOT NULL,
    "price" numeric(10,2) NOT NULL DEFAULT 0,
    "currency" character varying NOT NULL DEFAULT 'INR',
    "billingPeriod" character varying NOT NULL DEFAULT 'FREE',
    "isActive" boolean NOT NULL DEFAULT true,
    "displayOrder" integer NOT NULL DEFAULT 1,
    "features" jsonb NOT NULL,
    "limits" jsonb NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "planId" uuid NOT NULL REFERENCES "plans"("id"),
    "status" "subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "expiryDate" TIMESTAMP WITH TIME ZONE,
    "provider" character varying NOT NULL DEFAULT 'INTERNAL',
    "providerSubscriptionId" text,
    "providerPurchaseToken" text,
    "autoRenew" boolean NOT NULL DEFAULT true,
    "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false,
    "metadata" jsonb,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_subscriptions_user_status" ON "subscriptions" ("userId", "status");

-- 5. Create release_policy_snapshots table
CREATE TABLE IF NOT EXISTS "release_policy_snapshots" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" uuid NOT NULL,
    "policyVersion" integer NOT NULL DEFAULT 1,
    "policyId" character varying,
    "trigger" character varying NOT NULL DEFAULT 'CHECK_IN_ESCALATION',
    "verificationLevel" character varying NOT NULL DEFAULT 'STANDARD',
    "verificationRequired" boolean NOT NULL DEFAULT true,
    "escalationConfig" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "snapshotReason" text NOT NULL DEFAULT 'SYSTEM_PRESERVATION',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_release_policy_snapshots_user_version" ON "release_policy_snapshots" ("userId", "policyVersion");

-- 6. Seed initial plans
INSERT INTO "plans" ("code", "name", "description", "price", "currency", "billingPeriod", "isActive", "displayOrder", "features", "limits")
VALUES
(
    'STARTER',
    'Starter',
    'Start building your digital legacy.',
    0.00,
    'INR',
    'FREE',
    true,
    1,
    '{"CUSTOM_CHECK_IN": false, "CUSTOM_GRACE_PERIOD": false, "MULTIPLE_RECIPIENTS": false, "RECIPIENT_VERIFICATION": false, "ADVANCED_RELEASE_POLICY": false, "MULTIPLE_VERIFIERS": false, "ADVANCED_ESCALATION": false, "FULL_ACTIVITY_HISTORY": false, "PRIORITY_SUPPORT": false, "FAMILY_EMERGENCY_INSTRUCTIONS": false}'::jsonb,
    '{"TRUSTED_PERSONS": 1, "PERSONAL_MESSAGES": 3, "VIDEO_MESSAGES": 1, "VAULT_ITEMS": null}'::jsonb
),
(
    'SECURE',
    'Secure',
    'Secure your legacy and decide exactly who receives what.',
    999.00,
    'INR',
    'YEARLY',
    true,
    2,
    '{"CUSTOM_CHECK_IN": true, "CUSTOM_GRACE_PERIOD": true, "MULTIPLE_RECIPIENTS": true, "RECIPIENT_VERIFICATION": true, "ADVANCED_RELEASE_POLICY": false, "MULTIPLE_VERIFIERS": false, "ADVANCED_ESCALATION": false, "FULL_ACTIVITY_HISTORY": true, "PRIORITY_SUPPORT": false, "FAMILY_EMERGENCY_INSTRUCTIONS": false}'::jsonb,
    '{"TRUSTED_PERSONS": 3, "PERSONAL_MESSAGES": null, "VIDEO_MESSAGES": 10, "VAULT_ITEMS": null}'::jsonb
),
(
    'FAMILY',
    'Family',
    'Advanced protection and continuity for your family.',
    2499.00,
    'INR',
    'YEARLY',
    true,
    3,
    '{"CUSTOM_CHECK_IN": true, "CUSTOM_GRACE_PERIOD": true, "MULTIPLE_RECIPIENTS": true, "RECIPIENT_VERIFICATION": true, "ADVANCED_RELEASE_POLICY": true, "MULTIPLE_VERIFIERS": true, "ADVANCED_ESCALATION": true, "FULL_ACTIVITY_HISTORY": true, "PRIORITY_SUPPORT": true, "FAMILY_EMERGENCY_INSTRUCTIONS": true}'::jsonb,
    '{"TRUSTED_PERSONS": 8, "PERSONAL_MESSAGES": null, "VIDEO_MESSAGES": 50, "VAULT_ITEMS": null}'::jsonb
)
ON CONFLICT ("code") DO UPDATE SET
    "price" = EXCLUDED."price",
    "features" = EXCLUDED."features",
    "limits" = EXCLUDED."limits",
    "updatedAt" = now();

-- 7. Backfill all existing users without subscriptions to STARTER
INSERT INTO "subscriptions" ("userId", "planId", "status", "startDate", "provider", "autoRenew", "cancelAtPeriodEnd")
SELECT
    u."id" AS "userId",
    p."id" AS "planId",
    'ACTIVE'::"subscriptions_status_enum",
    now(),
    'INTERNAL',
    false,
    false
FROM "users" u
CROSS JOIN (SELECT "id" FROM "plans" WHERE "code" = 'STARTER' LIMIT 1) p
WHERE NOT EXISTS (
    SELECT 1 FROM "subscriptions" s WHERE s."userId" = u."id"
);
