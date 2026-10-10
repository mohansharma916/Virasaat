BEGIN;

ALTER TABLE legacy_items ADD COLUMN IF NOT EXISTS "payloadStorageType" text;
UPDATE legacy_items
SET "payloadStorageType" = CASE
  WHEN "ciphertextRef" LIKE 'vaults/%' OR "ciphertextRef" LIKE 's3://%' THEN 'S3'
  WHEN "encryptionKeyRef" ~ '"storageType"\s*:\s*"LOCAL"'
    OR "encryptionKeyRef" ~ '"mimeType"\s*:'
    OR "encryptionKeyRef" ~ '"storageKey"\s*:' THEN 'LOCAL'
  ELSE 'INLINE_DB'
END
WHERE "payloadStorageType" IS NULL;

-- Old event timestamps were emitted as JS instants and stored without a zone.
-- Interpret these existing values as UTC; do not reinterpret their calendar day.
DO $$
DECLARE event_column text;
BEGIN
  FOREACH event_column IN ARRAY ARRAY['dueAt', 'respondedAt', 'escalatedAt'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'check_in_events'
        AND information_schema.columns.column_name = event_column
        AND data_type <> 'timestamp with time zone'
    ) THEN
      EXECUTE format('ALTER TABLE check_in_events ALTER COLUMN %I TYPE timestamptz USING %I::timestamp AT TIME ZONE ''UTC''', event_column, event_column);
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'check_in_policies'
      AND information_schema.columns.column_name = 'nextCheckInAt'
      AND data_type <> 'timestamp with time zone'
  ) THEN
    UPDATE check_in_policies policy SET timezone = 'Asia/Kolkata'
      WHERE NOT EXISTS (SELECT 1 FROM pg_timezone_names zone WHERE zone.name = policy.timezone);
    UPDATE check_in_policies SET "preferredTime" = '09:00'
      WHERE "preferredTime" !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$';
    ALTER TABLE check_in_policies ALTER COLUMN "nextCheckInAt" TYPE timestamptz
      USING ("nextCheckInAt"::date + "preferredTime"::time) AT TIME ZONE timezone;
    -- Preserve the current pending event's actual due instant where available.
    UPDATE check_in_policies policy SET "nextCheckInAt" = pending.due
    FROM (SELECT "policyId", max("dueAt") due FROM check_in_events WHERE status = 'PENDING' GROUP BY "policyId") pending
    WHERE policy.id = pending."policyId";
  END IF;
END $$;

COMMIT;
