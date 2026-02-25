-- Allow local-auth frontend to insert/read/update notifications through anon/authenticated roles.
alter table if exists public.notifications enable row level security;

grant usage on schema public to anon;
grant usage on schema public to authenticated;

grant select, insert, update on table public.notifications to anon;
grant select, insert, update on table public.notifications to authenticated;

drop policy if exists "notifications_local_auth_select" on public.notifications;
create policy "notifications_local_auth_select"
on public.notifications
for select
to anon, authenticated
using (true);

drop policy if exists "notifications_local_auth_insert" on public.notifications;
create policy "notifications_local_auth_insert"
on public.notifications
for insert
to anon, authenticated
with check (true);

drop policy if exists "notifications_local_auth_update" on public.notifications;
create policy "notifications_local_auth_update"
on public.notifications
for update
to anon, authenticated
using (true)
with check (true);
