-- Enforce: one email = one account (case-insensitive) across admins and users.

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(trim(email))
    FROM public.admins
    GROUP BY lower(trim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate emails found inside admins table. Fix duplicates before applying migration.';
  END IF;

  IF EXISTS (
    SELECT lower(trim(email))
    FROM public.users
    GROUP BY lower(trim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate emails found inside users table. Fix duplicates before applying migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admins a
    JOIN public.users u ON lower(trim(a.email)) = lower(trim(u.email))
  ) THEN
    RAISE EXCEPTION 'Same email exists in both admins and users. Fix duplicates before applying migration.';
  END IF;
END;
$$;

UPDATE public.admins
SET email = lower(trim(email))
WHERE email <> lower(trim(email));

UPDATE public.users
SET email = lower(trim(email))
WHERE email <> lower(trim(email));

CREATE UNIQUE INDEX IF NOT EXISTS admins_email_lower_unique_idx
ON public.admins (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx
ON public.users (lower(email));

CREATE OR REPLACE FUNCTION public.ensure_global_unique_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    RAISE EXCEPTION 'Email obligatoire';
  END IF;

  NEW.email := lower(trim(NEW.email));

  IF TG_TABLE_NAME = 'admins' THEN
    IF EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = NEW.email
        AND a.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Email deja utilise dans admins';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.users u
      WHERE lower(u.email) = NEW.email
    ) THEN
      RAISE EXCEPTION 'Email deja utilise dans users';
    END IF;
  ELSIF TG_TABLE_NAME = 'users' THEN
    IF EXISTS (
      SELECT 1
      FROM public.users u
      WHERE lower(u.email) = NEW.email
        AND u.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Email deja utilise dans users';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = NEW.email
    ) THEN
      RAISE EXCEPTION 'Email deja utilise dans admins';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_global_unique_email_on_admins ON public.admins;
CREATE TRIGGER trg_ensure_global_unique_email_on_admins
BEFORE INSERT OR UPDATE OF email ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.ensure_global_unique_email();

DROP TRIGGER IF EXISTS trg_ensure_global_unique_email_on_users ON public.users;
CREATE TRIGGER trg_ensure_global_unique_email_on_users
BEFORE INSERT OR UPDATE OF email ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_global_unique_email();

