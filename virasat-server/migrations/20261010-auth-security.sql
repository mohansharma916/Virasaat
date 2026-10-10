BEGIN;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sessionVersion" integer NOT NULL DEFAULT 0;
ALTER TABLE "email_signups" ADD COLUMN IF NOT EXISTS "lastSentAt" timestamp NOT NULL DEFAULT now();
ALTER TABLE "password_resets" ADD COLUMN IF NOT EXISTS "lastSentAt" timestamp NOT NULL DEFAULT now();
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "providerVerifiedAt" timestamp with time zone;
CREATE TABLE IF NOT EXISTS "auth_rate_limits" (
  "key" varchar(64) PRIMARY KEY,
  "count" integer NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_auth_rate_limits_expiry" ON "auth_rate_limits" ("expiresAt");
COMMIT;
