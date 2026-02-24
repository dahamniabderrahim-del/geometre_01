ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "admin_id" UUID;

UPDATE "users" AS u
SET "admin_id" = link."admin_id"
FROM (
  SELECT DISTINCT ON ("user_id") "user_id", "admin_id"
  FROM "admin_users"
  ORDER BY "user_id", "assigned_at" DESC
) AS link
WHERE u."id" = link."user_id"
  AND u."admin_id" IS NULL;

CREATE INDEX IF NOT EXISTS "users_admin_id_idx" ON "users"("admin_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_admin_id_fkey'
  ) THEN
    ALTER TABLE "users"
    ADD CONSTRAINT "users_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DROP TABLE IF EXISTS "admin_users";
