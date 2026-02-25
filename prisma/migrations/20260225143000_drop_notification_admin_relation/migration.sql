DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT c.conname
  INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND t.relname = 'notifications'
    AND c.conname = 'notifications_admin_id_fkey'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "notifications" DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;
