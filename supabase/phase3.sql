-- ============================================================
-- FAMILY FITNESS — PHASE 3
-- Workout log. One row = all the sets you did at one weight,
-- exactly like a row in the spreadsheet.
-- Paste this whole file into the Supabase SQL Editor and Run.
-- ============================================================

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  logged_on date not null default current_date,
  day_name text,

  -- The exercise is kept by name as well as by id, so that deleting a custom
  -- exercise from the library never erases the training history that used it.
  exercise_id uuid references public.exercises (id) on delete set null,
  exercise_name text not null,

  weight_kg numeric(6, 2) not null,
  reps int not null,
  sets int not null,
  rpe numeric(3, 1),
  notes text,

  -- Volume is computed by the database, so it can never disagree with its parts.
  volume numeric(12, 2) generated always as (weight_kg * reps * sets) stored,

  created_at timestamptz not null default now(),

  constraint weight_not_negative check (weight_kg >= 0),
  constraint reps_at_least_one check (reps >= 1),
  constraint sets_at_least_one check (sets >= 1),
  constraint rpe_in_range check (rpe is null or (rpe >= 1 and rpe <= 10))
);

alter table public.workout_logs enable row level security;
grant select, insert, update, delete on public.workout_logs to authenticated;

create policy "Read own workout logs"
  on public.workout_logs for select using (user_id = auth.uid());
create policy "Create own workout logs"
  on public.workout_logs for insert with check (user_id = auth.uid());
create policy "Update own workout logs"
  on public.workout_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own workout logs"
  on public.workout_logs for delete using (user_id = auth.uid());

-- History reads newest-first; the second index powers "what did I lift last time?"
create index workout_logs_user_date_idx on public.workout_logs (user_id, logged_on desc);
create index workout_logs_user_exercise_idx on public.workout_logs (user_id, exercise_id, logged_on desc);
