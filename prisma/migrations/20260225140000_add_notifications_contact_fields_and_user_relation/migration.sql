ALTER TABLE "notifications"
ADD COLUMN IF NOT EXISTS "user_id" UUID,
ADD COLUMN IF NOT EXISTS "sender_name" TEXT,
ADD COLUMN IF NOT EXISTS "sender_email" TEXT,
ADD COLUMN IF NOT EXISTS "sender_phone" TEXT,
ADD COLUMN IF NOT EXISTS "subject" TEXT,
ADD COLUMN IF NOT EXISTS "sender_message" TEXT;

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
