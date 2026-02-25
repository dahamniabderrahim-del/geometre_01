-- One-to-many relation: one user can have many notifications.
alter table if exists public.notifications
add column if not exists user_id uuid;

create index if not exists idx_notifications_user_id
on public.notifications(user_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_user_id_fkey'
  ) then
    alter table public.notifications
    add constraint notifications_user_id_fkey
    foreign key (user_id)
    references public.users(id)
    on delete cascade;
  end if;
end
$$;
