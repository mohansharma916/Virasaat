BEGIN;

-- Plan perks. Runs after the subscriptions migration on every deploy, which
-- rewrites plan features, so these keys are merged back in each time.
UPDATE plans SET features = features || '{"SMS_CALL_REMINDERS": false, "IN_PERSON_VISIT": false}'::jsonb WHERE code = 'STARTER';
UPDATE plans SET features = features || '{"SMS_CALL_REMINDERS": true, "IN_PERSON_VISIT": false}'::jsonb WHERE code = 'SECURE';
UPDATE plans SET features = features || '{"SMS_CALL_REMINDERS": true, "IN_PERSON_VISIT": true}'::jsonb WHERE code = 'FAMILY';

-- Device tokens for app notifications (Firebase Cloud Messaging).
CREATE TABLE IF NOT EXISTS push_tokens (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES users("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "platform" text NOT NULL DEFAULT 'android',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_push_tokens_userId" ON push_tokens ("userId");

COMMIT;
