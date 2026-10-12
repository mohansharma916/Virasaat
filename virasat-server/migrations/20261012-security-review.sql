BEGIN;

-- Saved trusted-person notification preference. Nothing is sent from it yet.
ALTER TABLE recipients
  ADD COLUMN IF NOT EXISTS "notificationMode" text NOT NULL DEFAULT 'INFORM_ON_ACTIVATION';

COMMIT;
