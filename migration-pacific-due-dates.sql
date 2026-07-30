-- ============================================================
-- Migration: correct due dates stored at UTC midnight
-- Run once in the Supabase SQL Editor against an existing database.
-- Idempotent — safe to re-run. Only affects rows created before the
-- Pacific-time fix; new assignments are already stored correctly.
-- ============================================================

-- The web "add assignment" form used a date-only <input type="date">, and
-- new Date("2026-08-05") parses date-only strings as UTC midnight. So an
-- assignment picked for Aug 5 was stored as 2026-08-05T00:00:00Z, which is
-- Aug 4 at 5:00 PM Pacific — one day early once dates are bucketed by
-- Pacific day.
--
-- Those rows are identifiable by their exact midnight-UTC timestamp. Move
-- each to the last second of the same calendar day in Pacific time, which is
-- what "due Aug 5" was meant to mean.
--
-- Re-running is safe: 23:59:59 Pacific is never midnight UTC, so corrected
-- rows no longer match the WHERE clause.

-- Preview what will change before committing to it:
--   select id, name, due_date,
--          ((due_date at time zone 'UTC')::date + time '23:59:59')
--            at time zone 'America/Los_Angeles' as new_due_date
--   from assignments
--   where (due_date at time zone 'UTC')::time = '00:00:00';

update assignments
set due_date = ((due_date at time zone 'UTC')::date + time '23:59:59')
                 at time zone 'America/Los_Angeles'
where (due_date at time zone 'UTC')::time = '00:00:00';
