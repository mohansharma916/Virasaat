BEGIN;

-- Encrypted JPEG previews made on the owner's device at upload time.
ALTER TABLE legacy_items
  ADD COLUMN IF NOT EXISTS "thumbnail" text,
  ADD COLUMN IF NOT EXISTS "hasThumbnail" boolean NOT NULL DEFAULT false;

COMMIT;
