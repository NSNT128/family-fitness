-- ============================================================
-- FAMILY FITNESS — PHASE 4
-- Bodyweight tracker. One weigh-in per day.
-- Paste this whole file into the Supabase SQL Editor and Run.
-- ============================================================

create table public.body_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_on date not null default current_date,
  weight_kg numeric(5, 2) not null,
  created_at timestamptz not null default now(),

  constraint bodyweight_positive check (weight_kg > 0 and weight_kg < 500),

  -- Weighing in twice in one day updates that day rather than stacking up,
  -- which keeps the graph one point per day.
  constraint one_weigh_in_per_day unique (user_id, logged_on)
);

alter table public.body_weights enable row level security;
grant select, insert, update, delete on public.body_weights to authenticated;

create policy "Read own weights"
  on public.body_weights for select using (user_id = auth.uid());
create policy "Create own weights"
  on public.body_weights for insert with check (user_id = auth.uid());
create policy "Update own weights"
  on public.body_weights for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own weights"
  on public.body_weights for delete using (user_id = auth.uid());

create index body_weights_user_date_idx on public.body_weights (user_id, logged_on desc);
