ALTER TABLE "public"."admins"
ADD COLUMN IF NOT EXISTS "opening_hours_weekdays" TEXT,
ADD COLUMN IF NOT EXISTS "opening_hours_saturday" TEXT;
