-- Local auth flow:
-- - signup inserts into public.users
-- - signin reads from public.users
-- - contact/profile can update public.users
-- This project does not rely on Supabase session auth for local email/password.

alter table if exists public.users enable row level security;

grant select, insert, update on table public.users to anon;
grant select, insert, update on table public.users to authenticated;

drop policy if exists "users_local_auth_select" on public.users;
create policy "users_local_auth_select"
on public.users
for select
to anon, authenticated
using (true);

drop policy if exists "users_local_auth_insert" on public.users;
create policy "users_local_auth_insert"
on public.users
for insert
to anon, authenticated
with check (true);

drop policy if exists "users_local_auth_update" on public.users;
create policy "users_local_auth_update"
on public.users
for update
to anon, authenticated
using (true)
with check (true);
