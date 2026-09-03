create table if not exists public.planned_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  workout_type text not null check (workout_type in ('run', 'strength', 'metcon', 'recovery', 'rest', 'hybrid')),
  title text not null,
  description text not null default '',
  completed boolean not null default false,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  intensity text check (intensity in ('low', 'moderate', 'high')),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_date)
);

alter table public.planned_workouts enable row level security;

drop policy if exists "Users manage own planned workouts" on public.planned_workouts;
create policy "Users manage own planned workouts" on public.planned_workouts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists planned_workouts_user_date_idx
on public.planned_workouts (user_id, workout_date);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.planned_workouts to authenticated;

notify pgrst, 'reload schema';
