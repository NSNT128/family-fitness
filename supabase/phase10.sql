-- ============================================================
-- FAMILY FITNESS — PHASE 10
-- Security hardening for databases created before these fixes.
--
-- Both changes are also folded into phase5.sql / phase9.sql, so a fresh
-- install gets them automatically and does not need this file.
--
-- Paste into the Supabase SQL Editor and Run. Safe to re-run.
-- ============================================================

-- 1) recalculate_exercise_pr is SECURITY DEFINER, so it bypasses RLS internally.
--    Postgres grants EXECUTE to PUBLIC by default, which left it callable by any
--    signed-in user against any user id. It returns void and only ever writes
--    values recomputed from that user's own logs, so nothing could be read back
--    or corrupted — but the triggers are the only caller that needs it.
revoke execute on function public.recalculate_exercise_pr(uuid, text) from public;

-- 2) Spell out WITH CHECK on the cardio update policy. Postgres reuses the USING
--    expression when WITH CHECK is omitted, so this is not a behaviour change
--    today; it keeps the guarantee if USING is ever loosened, and matches every
--    other table in this schema.
drop policy if exists "Update own cardio" on public.cardio_logs;
create policy "Update own cardio" on public.cardio_logs for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Verify (optional). Expect:
--   * no rows for the function grant
--   * the cardio update policy showing both qual and with_check
-- ------------------------------------------------------------
-- select grantee, privilege_type
--   from information_schema.role_routine_grants
--  where routine_name = 'recalculate_exercise_pr' and grantee = 'PUBLIC';
--
-- select policyname, cmd, qual, with_check
--   from pg_policies
--  where tablename = 'cardio_logs' and cmd = 'UPDATE';
