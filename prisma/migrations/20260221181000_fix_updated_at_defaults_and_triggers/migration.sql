-- Ensure inserts do not fail when updated_at is omitted
ALTER TABLE "admins" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "realisations" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "services" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Keep updated_at in sync on UPDATE statements executed outside Prisma
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_admins ON "admins";
CREATE TRIGGER set_updated_at_admins
BEFORE UPDATE ON "admins"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_users ON "users";
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_realisations ON "realisations";
CREATE TRIGGER set_updated_at_realisations
BEFORE UPDATE ON "realisations"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_services ON "services";
CREATE TRIGGER set_updated_at_services
BEFORE UPDATE ON "services"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
