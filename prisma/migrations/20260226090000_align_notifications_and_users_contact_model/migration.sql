ALTER TABLE "notifications"
DROP CONSTRAINT IF EXISTS "notifications_admin_id_fkey";

DROP INDEX IF EXISTS "notifications_admin_id_idx";

ALTER TABLE "notifications"
DROP COLUMN IF EXISTS "admin_id",
DROP COLUMN IF EXISTS "sender_name",
DROP COLUMN IF EXISTS "sender_email",
DROP COLUMN IF EXISTS "sender_phone",
DROP COLUMN IF EXISTS "sender_message";

ALTER TABLE "users"
DROP COLUMN IF EXISTS "subject",
DROP COLUMN IF EXISTS "message";
