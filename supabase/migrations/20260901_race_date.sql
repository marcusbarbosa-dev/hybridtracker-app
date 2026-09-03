alter table public.athlete_profiles
  add column if not exists race_date date;
