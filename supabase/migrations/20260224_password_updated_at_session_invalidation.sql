-- Invalidate local sessions when password changes.
-- The frontend compares local password_updated_at with DB value and auto-logs out on mismatch.

alter table if exists public.users
add column if not exists password_updated_at timestamptz;

alter table if exists public.admins
add column if not exists password_updated_at timestamptz;

update public.users
set password_updated_at = coalesce(password_updated_at, now());

update public.admins
set password_updated_at = coalesce(password_updated_at, now());

alter table if exists public.users
alter column password_updated_at set default now();

alter table if exists public.admins
alter column password_updated_at set default now();

alter table if exists public.users
alter column password_updated_at set not null;

alter table if exists public.admins
alter column password_updated_at set not null;

create or replace function public.touch_password_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.password_updated_at := coalesce(new.password_updated_at, now());
    return new;
  end if;

  if new.password is distinct from old.password then
    new.password_updated_at := now();
  elsif new.password_updated_at is null then
    new.password_updated_at := coalesce(old.password_updated_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_touch_password_updated_at_users on public.users;
create trigger trg_touch_password_updated_at_users
before insert or update of password on public.users
for each row
execute function public.touch_password_updated_at();

drop trigger if exists trg_touch_password_updated_at_admins on public.admins;
create trigger trg_touch_password_updated_at_admins
before insert or update of password on public.admins
for each row
execute function public.touch_password_updated_at();
