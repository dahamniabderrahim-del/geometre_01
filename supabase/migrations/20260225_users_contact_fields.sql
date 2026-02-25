-- Ensure contact fields exist on users table for contact form persistence.
alter table if exists public.users
add column if not exists phone text;

alter table if exists public.users
add column if not exists subject text;

alter table if exists public.users
add column if not exists message text;
