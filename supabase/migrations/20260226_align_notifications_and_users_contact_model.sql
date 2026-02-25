-- Align contact/notification schema with local-auth model:
-- - notifications linked to users via user_id (no admin_id)
-- - users do not store contact message/subject

alter table if exists public.notifications
drop constraint if exists notifications_admin_id_fkey;

drop index if exists public.notifications_admin_id_idx;

alter table if exists public.notifications
drop column if exists admin_id;

alter table if exists public.notifications
drop column if exists sender_name;

alter table if exists public.notifications
drop column if exists sender_email;

alter table if exists public.notifications
drop column if exists sender_phone;

alter table if exists public.notifications
drop column if exists sender_message;

alter table if exists public.users
drop column if exists subject;

alter table if exists public.users
drop column if exists message;
