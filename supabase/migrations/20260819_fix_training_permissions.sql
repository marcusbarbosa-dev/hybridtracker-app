grant usage on schema public to authenticated;
grant select, insert, update, delete on public.athlete_profiles to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;

notify pgrst, 'reload schema';
