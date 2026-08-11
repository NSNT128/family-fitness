-- ============================================================
-- FAMILY FITNESS — PHASE 2
-- Exercise library + splits + split days + day exercises
-- Paste this whole file into the Supabase SQL Editor and Run.
-- ============================================================

-- ---------- EXERCISE LIBRARY ----------
-- user_id null  = built-in exercise, visible to everybody
-- user_id set   = a custom exercise, visible only to its owner
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text not null,
  default_splits text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Stops one person creating two custom exercises with the same name.
create unique index exercises_user_name_unique
  on public.exercises (user_id, lower(name))
  where user_id is not null;

alter table public.exercises enable row level security;
grant select, insert, update, delete on public.exercises to authenticated;

create policy "Read built-in and own exercises"
  on public.exercises for select
  using (user_id is null or user_id = auth.uid());

create policy "Create own custom exercises"
  on public.exercises for insert
  with check (user_id = auth.uid());

create policy "Update own custom exercises"
  on public.exercises for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Built-ins have user_id null, so this never matches them: they can't be deleted.
create policy "Delete own custom exercises"
  on public.exercises for delete
  using (user_id = auth.uid());

-- ---------- SPLITS ----------
create table public.splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- At most one active split per person.
create unique index splits_one_active_per_user
  on public.splits (user_id)
  where is_active;

alter table public.splits enable row level security;
grant select, insert, update, delete on public.splits to authenticated;

create policy "Read own splits"
  on public.splits for select using (user_id = auth.uid());
create policy "Create own splits"
  on public.splits for insert with check (user_id = auth.uid());
create policy "Update own splits"
  on public.splits for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own splits"
  on public.splits for delete using (user_id = auth.uid());

-- Marking a split active automatically stands the others down, so the
-- app never has to do it in two steps and can't leave two active.
create or replace function public.enforce_single_active_split()
returns trigger
language plpgsql
as $$
begin
  update public.splits
     set is_active = false
   where user_id = new.user_id
     and id <> new.id
     and is_active;
  return new;
end;
$$;

create trigger splits_single_active
  before insert or update of is_active on public.splits
  for each row when (new.is_active)
  execute function public.enforce_single_active_split();

-- ---------- DAYS WITHIN A SPLIT ----------
create table public.split_days (
  id uuid primary key default gen_random_uuid(),
  split_id uuid not null references public.splits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.split_days enable row level security;
grant select, insert, update, delete on public.split_days to authenticated;

create policy "Read own split days"
  on public.split_days for select using (user_id = auth.uid());
create policy "Create own split days"
  on public.split_days for insert with check (user_id = auth.uid());
create policy "Update own split days"
  on public.split_days for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own split days"
  on public.split_days for delete using (user_id = auth.uid());

-- ---------- EXERCISES ASSIGNED TO A DAY ----------
create table public.split_day_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.split_days (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.split_day_exercises enable row level security;
grant select, insert, update, delete on public.split_day_exercises to authenticated;

create policy "Read own day exercises"
  on public.split_day_exercises for select using (user_id = auth.uid());
create policy "Create own day exercises"
  on public.split_day_exercises for insert with check (user_id = auth.uid());
create policy "Update own day exercises"
  on public.split_day_exercises for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own day exercises"
  on public.split_day_exercises for delete using (user_id = auth.uid());

create index split_days_split_idx on public.split_days (split_id, position);
create index split_day_exercises_day_idx on public.split_day_exercises (day_id, position);

-- ---------- PRE-LOADED EXERCISE LIBRARY ----------
insert into public.exercises (user_id, name, muscle_group, default_splits) values
  (null, 'Bench Press',           'Chest',      '{Push,Upper}'),
  (null, 'Incline DB Press',      'Chest',      '{Push}'),
  (null, 'Overhead Press',        'Shoulders',  '{Push,Upper}'),
  (null, 'Lateral Raise',         'Shoulders',  '{Push}'),
  (null, 'Face Pull',             'Shoulders',  '{Pull}'),
  (null, 'Triceps Pushdown',      'Triceps',    '{Push}'),
  (null, 'Deadlift',              'Back',       '{Pull}'),
  (null, 'Barbell Row',           'Back',       '{Pull,Upper}'),
  (null, 'Pull-Up',               'Back',       '{Pull,Upper}'),
  (null, 'Lat Pulldown',          'Back',       '{Pull}'),
  (null, 'Preacher Curl',         'Biceps',     '{Pull}'),
  (null, 'Squat',                 'Quads',      '{Legs,Lower}'),
  (null, 'Leg Press',             'Quads',      '{Lower}'),
  (null, 'Leg Extension',         'Quads',      '{Legs,Lower}'),
  (null, 'Bulgarian Split Squat', 'Quads',      '{Legs}'),
  (null, 'Romanian Deadlift',     'Hamstrings', '{Legs}'),
  (null, 'Leg Curl',              'Hamstrings', '{Legs,Lower}'),
  (null, 'Calf Raise',            'Calves',     '{Legs}');
