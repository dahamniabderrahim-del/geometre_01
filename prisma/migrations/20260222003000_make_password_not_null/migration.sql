UPDATE "admins"
SET "password" = ''
WHERE "password" IS NULL;

UPDATE "users"
SET "password" = ''
WHERE "password" IS NULL;

ALTER TABLE "admins"
ALTER COLUMN "password" SET DEFAULT '';

ALTER TABLE "users"
ALTER COLUMN "password" SET DEFAULT '';

ALTER TABLE "admins"
ALTER COLUMN "password" SET NOT NULL;

ALTER TABLE "users"
ALTER COLUMN "password" SET NOT NULL;
