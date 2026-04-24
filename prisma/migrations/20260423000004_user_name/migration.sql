-- Add name column (nullable first to not break existing rows)
ALTER TABLE "users" ADD COLUMN "name" TEXT;

-- Backfill existing rows with email prefix as default name
UPDATE "users" SET "name" = split_part("email", '@', 1) WHERE "name" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
