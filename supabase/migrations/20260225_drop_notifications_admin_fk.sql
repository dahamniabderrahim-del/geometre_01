-- Remove notifications -> admins foreign key relation.
alter table if exists public.notifications
drop constraint if exists notifications_admin_id_fkey;
