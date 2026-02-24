ALTER TABLE "notifications"
ADD COLUMN IF NOT EXISTS "admin_id" UUID;

UPDATE "notifications" AS n
SET "admin_id" = u."admin_id"
FROM "users" AS u
WHERE n."user_id" = u."id"
  AND n."admin_id" IS NULL;

CREATE INDEX IF NOT EXISTS "notifications_admin_id_idx" ON "notifications"("admin_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_admin_id_fkey'
  ) THEN
    ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "notifications"
DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";

DROP INDEX IF EXISTS "notifications_user_id_idx";

ALTER TABLE "notifications"
DROP COLUMN IF EXISTS "user_id";
