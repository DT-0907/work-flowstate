-- ============================================================
-- Migration: username + password login
-- Run once in the Supabase SQL Editor against an existing database.
-- Idempotent — safe to re-run. Already folded into setup.sql for fresh installs.
-- ============================================================

-- 1. Username column on profiles
alter table profiles add column if not exists username text;

-- Case-insensitive uniqueness ("Delbert" and "delbert" are the same handle)
create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

alter table profiles drop constraint if exists profiles_username_format;
alter table profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-zA-Z0-9_]{3,24}$');

-- 2. Username -> email resolution
-- Login is username + password, but Supabase authenticates on email + password.
-- An unauthenticated client cannot read profiles (RLS), so this security-definer
-- function is the one narrow lookup anon is allowed: exact username -> account email.
-- Reads auth.users rather than profiles.email so it always matches the address
-- signInWithPassword expects, even if the profile row is stale.
create or replace function public.email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- ============================================================
-- Done.
-- ============================================================
