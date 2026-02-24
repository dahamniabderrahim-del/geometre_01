alter table public.admins
add column if not exists grade text;

update public.admins
set
  name = 'ayoub benali',
  grade = 'geometre expert foncier'
where lower(email) = 'ayoub3100yt@gmail.com';
