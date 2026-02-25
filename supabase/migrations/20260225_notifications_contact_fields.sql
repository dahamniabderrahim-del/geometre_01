-- Store structured contact data in notifications for user-submitted messages.
alter table if exists public.notifications
add column if not exists user_id uuid;

alter table if exists public.notifications
add column if not exists sender_name text;

alter table if exists public.notifications
add column if not exists sender_email text;

alter table if exists public.notifications
add column if not exists sender_phone text;

alter table if exists public.notifications
add column if not exists subject text;

alter table if exists public.notifications
add column if not exists sender_message text;
