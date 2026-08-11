-- ============================================================
-- FAMILY FITNESS — PHASE 9
-- Cardio logging (treadmill / bike / rower ...).
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe to re-run.
-- ============================================================

create table if not exists public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null,
  machine text not null default 'Treadmill',
  speed_kmh numeric(5, 2) not null,
  incline_pct numeric(4, 1) not null default 0,
  minutes numeric(6, 2) not null,
  notes text,
  created_at timestamptz not null default now(),

  -- Distance is a fact of speed x time, so the database derives it and nothing
  -- can write a value that disagrees. Same approach as workout_logs.volume.
  distance_km numeric(8, 3) generated always as (speed_kmh * minutes / 60) stored,

  constraint speed_range check (speed_kmh >= 0 and speed_kmh <= 60),
  constraint incline_range check (incline_pct >= 0 and incline_pct <= 40),
  constraint minutes_positive check (minutes > 0 and minutes <= 600)
);

alter table public.cardio_logs enable row level security;

-- Explicit grants: this project has "Automatically expose new tables" off, so
-- RLS policies alone are not enough.
grant select, insert, update, delete on public.cardio_logs to authenticated;

drop policy if exists "Read own cardio" on public.cardio_logs;
drop policy if exists "Insert own cardio" on public.cardio_logs;
drop policy if exists "Update own cardio" on public.cardio_logs;
drop policy if exists "Delete own cardio" on public.cardio_logs;

create policy "Read own cardio"   on public.cardio_logs for select using (user_id = auth.uid());
create policy "Insert own cardio" on public.cardio_logs for insert with check (user_id = auth.uid());
create policy "Update own cardio" on public.cardio_logs for update using (user_id = auth.uid());
create policy "Delete own cardio" on public.cardio_logs for delete using (user_id = auth.uid());

create index if not exists cardio_logs_user_date_idx
  on public.cardio_logs (user_id, logged_on desc);
