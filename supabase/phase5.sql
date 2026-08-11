-- ============================================================
-- FAMILY FITNESS — PHASE 5
-- Personal Records (PRs) per exercise. Auto-calculated from logs.
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe to re-run: drops and rebuilds cleanly.
-- ============================================================

-- Clean slate so this file can be re-run without "already exists" errors.
drop trigger if exists workout_logs_insert_pr on public.workout_logs;
drop trigger if exists workout_logs_update_pr on public.workout_logs;
drop trigger if exists workout_logs_delete_pr on public.workout_logs;
drop function if exists trg_recalculate_pr();
drop function if exists recalculate_exercise_pr(uuid, text);
drop table if exists public.exercise_prs;

create table public.exercise_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  exercise_name text not null,
  best_weight_kg numeric(5, 2) not null,
  reps_at_best_weight int not null,
  best_volume_kg numeric(9, 2) not null,
  times_logged int not null default 0,
  updated_at timestamptz not null default now(),

  -- >= 0, not > 0: bodyweight exercises (Pull-Up, Dip) are logged at 0 kg.
  constraint best_weight_nonneg check (best_weight_kg >= 0),
  constraint best_volume_positive check (best_volume_kg >= 0),
  constraint times_logged_positive check (times_logged > 0),
  constraint one_pr_per_user_exercise unique (user_id, exercise_name)
);

alter table public.exercise_prs enable row level security;

-- PRs are a COMPUTED table: the triggers below are the only writer. Users can
-- read their own rows but never write them directly, so the numbers can't be
-- faked or corrupted out of sync with the logs.
grant select on public.exercise_prs to authenticated;

create policy "Read own PRs"
  on public.exercise_prs for select using (user_id = auth.uid());

create index exercise_prs_user_idx on public.exercise_prs (user_id);

-- Recalculate all PR stats for one exercise from its logs.
-- SECURITY DEFINER so the trigger can maintain the computed table even though
-- users have no write policy; search_path pinned to public to stay injection-safe.
create or replace function recalculate_exercise_pr(p_user_id uuid, p_exercise_name text)
  returns void
  security definer
  set search_path = public
  as $$
declare
  v_best_weight numeric(5,2);
  v_reps_at_best int;
  v_best_volume numeric(9,2);
  v_times_logged int;
  v_exercise_id uuid;
begin
  -- Find best weight (max weight) and reps at that weight (pick highest reps if tied)
  select weight_kg, reps into v_best_weight, v_reps_at_best
  from workout_logs
  where user_id = p_user_id and exercise_name = p_exercise_name
  order by weight_kg desc, reps desc
  limit 1;

  -- If no logs remain, delete the PR row
  if v_best_weight is null then
    delete from exercise_prs where user_id = p_user_id and exercise_name = p_exercise_name;
    return;
  end if;

  -- Find best volume in a single session
  select max(volume) into v_best_volume
  from workout_logs
  where user_id = p_user_id and exercise_name = p_exercise_name;

  -- Count distinct logged sessions (number of logs)
  select count(*) into v_times_logged
  from workout_logs
  where user_id = p_user_id and exercise_name = p_exercise_name;

  -- Get exercise_id if it exists (for custom exercises, it may be null)
  select exercise_id into v_exercise_id
  from workout_logs
  where user_id = p_user_id and exercise_name = p_exercise_name and exercise_id is not null
  limit 1;

  -- Upsert the PR row
  insert into exercise_prs (user_id, exercise_id, exercise_name, best_weight_kg, reps_at_best_weight, best_volume_kg, times_logged, updated_at)
  values (p_user_id, v_exercise_id, p_exercise_name, v_best_weight, v_reps_at_best, coalesce(v_best_volume, 0), v_times_logged, now())
  on conflict (user_id, exercise_name) do update set
    exercise_id = coalesce(excluded.exercise_id, exercise_prs.exercise_id),
    best_weight_kg = excluded.best_weight_kg,
    reps_at_best_weight = excluded.reps_at_best_weight,
    best_volume_kg = excluded.best_volume_kg,
    times_logged = excluded.times_logged,
    updated_at = now();
end;
$$ language plpgsql;

-- Postgres grants EXECUTE on new functions to PUBLIC by default. This one is
-- SECURITY DEFINER, so it bypasses RLS internally — leaving it callable would let
-- any signed-in user invoke it against another user's id. It only ever recomputes
-- correct values and returns void, so nothing leaks, but the triggers below are
-- the only caller that needs it.
revoke execute on function recalculate_exercise_pr(uuid, text) from public;

-- Wrapper trigger function. Trigger functions can't take arguments the way a
-- normal function does — they receive NEW/OLD implicitly — so this reads the row
-- and calls the recalc helper. On an edit that renames the exercise (or moves it
-- to a different user), both the old and new names are recalculated.
create or replace function trg_recalculate_pr() returns trigger as $$
begin
  if (TG_OP = 'DELETE') then
    perform recalculate_exercise_pr(OLD.user_id, OLD.exercise_name);
    return OLD;
  end if;

  if (TG_OP = 'UPDATE' and
      (OLD.user_id is distinct from NEW.user_id or OLD.exercise_name is distinct from NEW.exercise_name)) then
    perform recalculate_exercise_pr(OLD.user_id, OLD.exercise_name);
  end if;

  perform recalculate_exercise_pr(NEW.user_id, NEW.exercise_name);
  return NEW;
end;
$$ language plpgsql;

create trigger workout_logs_insert_pr
after insert on workout_logs
for each row
execute function trg_recalculate_pr();

create trigger workout_logs_update_pr
after update on workout_logs
for each row
when (OLD.weight_kg is distinct from NEW.weight_kg
   or OLD.reps is distinct from NEW.reps
   or OLD.sets is distinct from NEW.sets
   or OLD.exercise_name is distinct from NEW.exercise_name)
execute function trg_recalculate_pr();

create trigger workout_logs_delete_pr
after delete on workout_logs
for each row
execute function trg_recalculate_pr();

-- One-time backfill: build PRs from every workout already logged before these
-- triggers existed, so nobody has to re-log to see their records.
do $$
declare
  r record;
begin
  for r in select distinct user_id, exercise_name from workout_logs loop
    perform recalculate_exercise_pr(r.user_id, r.exercise_name);
  end loop;
end;
$$;
