-- ============================================================
-- PHASE 1 FIX — run this once in the Supabase SQL Editor.
--
-- Why: "Automatically expose new tables" is turned off (the safer
-- setting), so logged-in users were never granted access to the
-- profiles table. Row-Level Security still decides WHICH rows each
-- person can see — this just opens the door to the table at all.
-- ============================================================

grant select, insert, update, delete on public.profiles to authenticated;
