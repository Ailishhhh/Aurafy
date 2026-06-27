-- Aurafy database schema.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It creates the profiles + scans tables, locks them down with Row Level
-- Security (each user can only read/write their OWN rows), and auto-creates a
-- profile row whenever a new user signs up.

-- ───────────────────────── profiles ─────────────────────────
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  name                  text,
  goals                 text[] default '{}',
  age_range             text,
  gender                text,
  time_per_day          text,
  onboarding_completed  boolean default false,
  streak_current        int default 0,
  streak_longest        int default 0,
  streak_last_active    date,
  is_premium            boolean default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ───────────────────────── scans ─────────────────────────
create table if not exists public.scans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  overall     int,
  potential   int,
  face_shape  text,
  headline    text,
  data        jsonb,                 -- full Analysis JSON (metrics, plan, hairstyles…)
  created_at  timestamptz default now()
);

alter table public.scans enable row level security;

drop policy if exists "Users manage own scans" on public.scans;
create policy "Users manage own scans" on public.scans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists scans_user_created_idx
  on public.scans (user_id, created_at desc);

-- ──────────── auto-create a profile row on new sign-up ────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
