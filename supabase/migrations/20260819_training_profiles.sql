create table if not exists public.athlete_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null,
  level text not null,
  training_days integer not null check (training_days between 1 and 7),
  equipment text[] not null default '{}',
  run_reference text,
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null default current_date,
  workout_name text not null,
  completion_status text not null check (completion_status in ('Rx', 'Scaled', 'Parcial', 'Time Cap')),
  planned_rpe integer check (planned_rpe between 1 and 10),
  actual_rpe integer check (actual_rpe between 1 and 10),
  duration_minutes integer,
  notes text,
  session_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.athlete_profiles enable row level security;
alter table public.workout_logs enable row level security;

drop policy if exists "Users manage own athlete profile" on public.athlete_profiles;
create policy "Users manage own athlete profile" on public.athlete_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own workout logs" on public.workout_logs;
create policy "Users manage own workout logs" on public.workout_logs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists workout_logs_user_date_idx
on public.workout_logs (user_id, workout_date desc);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.athlete_profiles to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;
