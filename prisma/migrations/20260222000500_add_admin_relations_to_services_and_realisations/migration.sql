ALTER TABLE "services"
ADD COLUMN IF NOT EXISTS "admin_id" UUID;

ALTER TABLE "realisations"
ADD COLUMN IF NOT EXISTS "admin_id" UUID;

WITH default_admin AS (
  SELECT "id"
  FROM "admins"
  ORDER BY "created_at" ASC
  LIMIT 1
)
UPDATE "services" AS s
SET "admin_id" = d."id"
FROM default_admin d
WHERE s."admin_id" IS NULL;

WITH default_admin AS (
  SELECT "id"
  FROM "admins"
  ORDER BY "created_at" ASC
  LIMIT 1
)
UPDATE "realisations" AS r
SET "admin_id" = d."id"
FROM default_admin d
WHERE r."admin_id" IS NULL;

ALTER TABLE "services"
ALTER COLUMN "admin_id" SET NOT NULL;

ALTER TABLE "realisations"
ALTER COLUMN "admin_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_admin_id_fkey'
  ) THEN
    ALTER TABLE "services"
    ADD CONSTRAINT "services_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'realisations_admin_id_fkey'
  ) THEN
    ALTER TABLE "realisations"
    ADD CONSTRAINT "realisations_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "services_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "services_admin_id_slug_key" ON "services"("admin_id", "slug");

DROP INDEX IF EXISTS "services_active_sort_order_idx";
CREATE INDEX IF NOT EXISTS "services_admin_id_active_sort_order_idx" ON "services"("admin_id", "active", "sort_order");

CREATE INDEX IF NOT EXISTS "realisations_admin_id_created_at_idx" ON "realisations"("admin_id", "created_at");
