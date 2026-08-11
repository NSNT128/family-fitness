-- ============================================================
-- FAMILY FITNESS — PHASE 1
-- Profiles table + Row-Level Security + auto-create on signup
-- Paste this whole file into the Supabase SQL Editor and Run.
-- ============================================================

-- One profile row per account. Height/weights are filled in from Phase 2.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  height_cm numeric,
  starting_weight_kg numeric,
  goal_weight_kg numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row-Level Security: nobody can touch a row that isn't theirs.
alter table public.profiles enable row level security;

-- Table-level permission for logged-in users. This is required IN ADDITION to
-- the RLS policies below: Postgres needs both a GRANT and a passing policy.
-- (Needed because "Automatically expose new tables" is off in the Data API
-- settings — which is the safer setting, so we grant explicitly per table.)
grant select, insert, update, delete on public.profiles to authenticated;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- When someone signs up, automatically create their profile row
-- using the name they typed on the signup form.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
