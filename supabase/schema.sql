create extension if not exists pgcrypto;

create type public.subscription_status as enum ('trial', 'active', 'past_due', 'canceled', 'expired');
create type public.subscription_plan as enum ('monthly', 'yearly');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  buyer_email text not null,
  provider text not null default 'hotmart' check (provider = 'hotmart'),
  provider_subscription_id text,
  provider_transaction_id text,
  provider_product_id text,
  plan public.subscription_plan,
  status public.subscription_status not null default 'trial',
  access_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  hydration_enabled boolean not null default true,
  nutrition_enabled boolean not null default true,
  sleep_enabled boolean not null default true,
  email_enabled boolean not null default false,
  hydration_interval_hours smallint not null default 3 check (hydration_interval_hours between 1 and 8),
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  timezone text not null default 'America/Sao_Paulo',
  push_subscription jsonb,
  updated_at timestamptz not null default now()
);

create table public.hotmart_webhook_events (
  event_id text primary key,
  event_name text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.hotmart_webhook_events enable row level security;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users manage own notification preferences" on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  insert into public.notification_preferences (user_id) values (new.id);
  update public.subscriptions set user_id = new.id, updated_at = now()
  where user_id is null and lower(buyer_email) = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
