-- Aplica o novo período comercial aos cadastros criados após esta migração.
-- Trials já iniciados mantêm a data previamente concedida.
alter table public.profiles
  alter column trial_ends_at set default (now() + interval '7 days');

notify pgrst, 'reload schema';
