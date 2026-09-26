-- Apply to the existing schema before deploying the updated API when synchronize=false.
-- No destructive backfill: old items remain unassigned and cannot be released.
-- Run with npm run db:migrate:prd21 so the enum is committed before first use.
ALTER TYPE recipients_status_enum ADD VALUE IF NOT EXISTS 'PRIVATE';

BEGIN;
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS "requestKey" text;
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_4d963ffa3a3848b1fe88d982aa" ON recipients ("userId", "requestKey");
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS "verificationRequired" boolean NOT NULL DEFAULT true;
ALTER TABLE recipients ALTER COLUMN status SET DEFAULT 'PRIVATE';
ALTER TABLE release_policies ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE release_policies ADD COLUMN IF NOT EXISTS "verificationRequired" boolean NOT NULL DEFAULT true;
ALTER TABLE legacy_items ADD COLUMN IF NOT EXISTS assignment jsonb;
ALTER TABLE legacy_items ADD COLUMN IF NOT EXISTS "requestKey" text;
ALTER TABLE legacy_items ADD COLUMN IF NOT EXISTS "requestHash" text;
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_1c152f18783fa0c20d8ecf2cda" ON legacy_items ("vaultId", "requestKey");
COMMIT;
