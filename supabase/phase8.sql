-- ============================================================
-- FAMILY FITNESS — PHASE 8
-- Weekly workout goal + birth year (for calorie estimates).
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe to re-run.
-- ============================================================

alter table public.profiles
  add column if not exists weekly_workout_goal int not null default 4;

alter table public.profiles
  add column if not exists birth_year int;

-- Keep the values sane. (Guarded so the file can be re-run without errors.)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'weekly_goal_range') then
    alter table public.profiles
      add constraint weekly_goal_range check (weekly_workout_goal between 1 and 14);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'birth_year_range') then
    alter table public.profiles
      add constraint birth_year_range check (birth_year is null or birth_year between 1900 and 2025);
  end if;
end $$;

-- New columns inherit the profiles table's existing grants + RLS, so no extra
-- GRANT is needed here.
