-- ============================================================
-- FlowState v2 — Full Database Setup (WIPES EXISTING DATA)
-- ============================================================
-- Run this entire script in the Supabase SQL Editor.
-- WARNING: This drops ALL existing tables and recreates them.
-- ============================================================

-- 0. Drop everything
-- ============================================================
drop view if exists today_habits cascade;
drop table if exists score_changes cascade;
drop table if exists habit_area_mappings cascade;
drop table if exists life_area_scores cascade;
drop table if exists journal_entries cascade;
drop table if exists user_settings cascade;
drop table if exists skipped_recommendations cascade;
drop table if exists habit_completions cascade;
drop table if exists assignments cascade;
drop table if exists habits cascade;
drop table if exists profiles cascade;
drop type if exists time_of_day cascade;
drop type if exists habit_frequency cascade;
drop type if exists assignment_priority cascade;
drop type if exists assignment_status cascade;
drop type if exists task_type cascade;
drop type if exists life_area cascade;

-- 1. Extensions
-- ============================================================
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- 2. Types
-- ============================================================
create type time_of_day as enum ('morning', 'midday', 'night');
create type habit_frequency as enum ('daily', 'weekdays', 'weekends', 'custom');
create type assignment_priority as enum ('low', 'medium', 'high', 'urgent');
create type assignment_status as enum ('pending', 'in_progress', 'completed');
create type task_type as enum ('habit', 'assignment');
create type life_area as enum ('intellectual', 'mental', 'spiritual', 'financial', 'physical', 'social');

-- 3. Tables
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  timezone text default 'America/Los_Angeles',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text default '',
  time_of_day time_of_day not null,
  frequency habit_frequency default 'daily',
  custom_days int[] default '{}',
  streak int default 0,
  is_active boolean default true,
  completion_count int default 0,
  embedding_text text,
  embedding vector(384),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text default '',
  course text default '',
  due_date timestamptz not null,
  estimated_minutes int not null default 60,
  priority assignment_priority default 'medium',
  status assignment_status default 'pending',
  completed_at timestamptz,
  embedding_text text,
  embedding vector(384),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  completed_date date not null default current_date,
  created_at timestamptz default now(),
  unique (habit_id, completed_date)
);

create table skipped_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  task_type task_type not null,
  task_id uuid not null,
  skipped_date date default current_date,
  created_at timestamptz default now()
);

-- Life area scores (6 areas per user, each 0-100)
create table life_area_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  area life_area not null,
  score float default 50.0 check (score >= 0 and score <= 100),
  updated_at timestamptz default now(),
  unique(user_id, area)
);

-- Maps habits to life areas with relevance (auto-generated)
create table habit_area_mappings (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  area life_area not null,
  relevance float default 0.5 check (relevance >= 0 and relevance <= 1),
  unique(habit_id, area)
);

-- Score change log
create table score_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  area life_area not null,
  change float not null,
  reason text,
  created_at timestamptz default now()
);

-- Daily journal
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  entry_date date not null default current_date,
  goals text[] default '{"", "", ""}',
  appreciation text default '',
  learned text default '',
  improve text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entry_date)
);

-- User settings
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  theme text default 'dark' check (theme in ('dark', 'light')),
  pomodoro_work int default 25,
  pomodoro_break int default 5,
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 4. Indexes
-- ============================================================
create index habits_embedding_idx on habits
  using ivfflat (embedding vector_cosine_ops) with (lists = 20);
create index assignments_embedding_idx on assignments
  using ivfflat (embedding vector_cosine_ops) with (lists = 20);
create index habits_user_active_idx on habits (user_id, is_active);
create index habits_user_time_idx on habits (user_id, time_of_day) where is_active = true;
create index assignments_user_status_idx on assignments (user_id, status);
create index assignments_user_due_idx on assignments (user_id, due_date) where status != 'completed';
create index habit_completions_lookup_idx on habit_completions (habit_id, completed_date);
create index habit_completions_user_date_idx on habit_completions (user_id, completed_date);
create index skipped_recs_lookup_idx on skipped_recommendations (user_id, skipped_date);
create index life_area_scores_user_idx on life_area_scores (user_id);
create index habit_area_mappings_habit_idx on habit_area_mappings (habit_id);
create index journal_entries_user_date_idx on journal_entries (user_id, entry_date);
create index score_changes_user_idx on score_changes (user_id, created_at);

-- 5. RLS
-- ============================================================
alter table profiles enable row level security;
alter table habits enable row level security;
alter table assignments enable row level security;
alter table habit_completions enable row level security;
alter table skipped_recommendations enable row level security;
alter table life_area_scores enable row level security;
alter table habit_area_mappings enable row level security;
alter table score_changes enable row level security;
alter table journal_entries enable row level security;
alter table user_settings enable row level security;

-- Profiles
create policy "own_profile_select" on profiles for select using (auth.uid() = id);
create policy "own_profile_update" on profiles for update using (auth.uid() = id);
create policy "own_profile_insert" on profiles for insert with check (auth.uid() = id);

-- Habits
create policy "own_habits_select" on habits for select using (auth.uid() = user_id);
create policy "own_habits_insert" on habits for insert with check (auth.uid() = user_id);
create policy "own_habits_update" on habits for update using (auth.uid() = user_id);
create policy "own_habits_delete" on habits for delete using (auth.uid() = user_id);

-- Assignments
create policy "own_assignments_select" on assignments for select using (auth.uid() = user_id);
create policy "own_assignments_insert" on assignments for insert with check (auth.uid() = user_id);
create policy "own_assignments_update" on assignments for update using (auth.uid() = user_id);
create policy "own_assignments_delete" on assignments for delete using (auth.uid() = user_id);

-- Habit completions
create policy "own_completions_select" on habit_completions for select using (auth.uid() = user_id);
create policy "own_completions_insert" on habit_completions for insert with check (auth.uid() = user_id);
create policy "own_completions_delete" on habit_completions for delete using (auth.uid() = user_id);

-- Skipped recommendations
create policy "own_skips_select" on skipped_recommendations for select using (auth.uid() = user_id);
create policy "own_skips_insert" on skipped_recommendations for insert with check (auth.uid() = user_id);

-- Life area scores
create policy "own_scores_select" on life_area_scores for select using (auth.uid() = user_id);
create policy "own_scores_insert" on life_area_scores for insert with check (auth.uid() = user_id);
create policy "own_scores_update" on life_area_scores for update using (auth.uid() = user_id);

-- Habit area mappings (readable if you own the habit)
create policy "own_mappings_select" on habit_area_mappings for select
  using (exists (select 1 from habits where habits.id = habit_area_mappings.habit_id and habits.user_id = auth.uid()));
create policy "own_mappings_insert" on habit_area_mappings for insert
  with check (exists (select 1 from habits where habits.id = habit_area_mappings.habit_id and habits.user_id = auth.uid()));
create policy "own_mappings_delete" on habit_area_mappings for delete
  using (exists (select 1 from habits where habits.id = habit_area_mappings.habit_id and habits.user_id = auth.uid()));

-- Score changes
create policy "own_changes_select" on score_changes for select using (auth.uid() = user_id);
create policy "own_changes_insert" on score_changes for insert with check (auth.uid() = user_id);

-- Journal
create policy "own_journal_select" on journal_entries for select using (auth.uid() = user_id);
create policy "own_journal_insert" on journal_entries for insert with check (auth.uid() = user_id);
create policy "own_journal_update" on journal_entries for update using (auth.uid() = user_id);
create policy "own_journal_delete" on journal_entries for delete using (auth.uid() = user_id);

-- Settings
create policy "own_settings_select" on user_settings for select using (auth.uid() = user_id);
create policy "own_settings_insert" on user_settings for insert with check (auth.uid() = user_id);
create policy "own_settings_update" on user_settings for update using (auth.uid() = user_id);

-- 6. Triggers
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  -- Initialize 6 life area scores at 50
  insert into public.life_area_scores (user_id, area) values
    (new.id, 'intellectual'), (new.id, 'mental'), (new.id, 'spiritual'),
    (new.id, 'financial'), (new.id, 'physical'), (new.id, 'social');
  -- Initialize default settings
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger habits_updated_at before update on habits for each row execute function update_updated_at();
create trigger assignments_updated_at before update on assignments for each row execute function update_updated_at();
create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger journal_updated_at before update on journal_entries for each row execute function update_updated_at();
create trigger settings_updated_at before update on user_settings for each row execute function update_updated_at();

-- 7. RPC Functions
-- ============================================================

create or replace function match_habits(
  query_embedding vector(384),
  match_threshold float default 0.1,
  match_count int default 5,
  p_user_id uuid default null,
  p_time_of_day time_of_day default null
)
returns table (id uuid, name text, description text, time_of_day time_of_day, streak int, similarity float)
language sql stable as $$
  select h.id, h.name, h.description, h.time_of_day, h.streak,
    (1 - (h.embedding <=> query_embedding))::float as similarity
  from habits h
  where h.user_id = p_user_id and h.is_active = true
    and (p_time_of_day is null or h.time_of_day = p_time_of_day)
    and h.embedding is not null
    and not exists (select 1 from habit_completions hc where hc.habit_id = h.id and hc.completed_date = current_date)
    and not exists (select 1 from skipped_recommendations sr where sr.task_id = h.id and sr.task_type = 'habit' and sr.skipped_date = current_date)
    and (1 - (h.embedding <=> query_embedding)) > match_threshold
  order by similarity desc limit match_count;
$$;

create or replace function match_assignments(
  query_embedding vector(384),
  match_threshold float default 0.1,
  match_count int default 5,
  p_user_id uuid default null
)
returns table (id uuid, name text, description text, course text, due_date timestamptz, estimated_minutes int, priority assignment_priority, similarity float, urgency_score float)
language sql stable as $$
  select a.id, a.name, a.description, a.course, a.due_date, a.estimated_minutes, a.priority,
    (1 - (a.embedding <=> query_embedding))::float as similarity,
    least(1.0 / greatest(extract(epoch from (a.due_date - now())) / 86400.0, 0.5), 2.0)::float as urgency_score
  from assignments a
  where a.user_id = p_user_id and a.status != 'completed' and a.embedding is not null
    and not exists (select 1 from skipped_recommendations sr where sr.task_id = a.id and sr.task_type = 'assignment' and sr.skipped_date = current_date)
    and (1 - (a.embedding <=> query_embedding)) > match_threshold
  order by similarity desc limit match_count;
$$;

create or replace function recalculate_streak(p_habit_id uuid)
returns int language plpgsql as $$
declare v_streak int := 0; v_check_date date := current_date; v_exists boolean;
begin
  loop
    select exists(select 1 from habit_completions where habit_id = p_habit_id and completed_date = v_check_date) into v_exists;
    if not v_exists then
      if v_check_date = current_date then v_check_date := v_check_date - 1; continue; end if;
      exit;
    end if;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  end loop;
  update habits set streak = v_streak where id = p_habit_id;
  return v_streak;
end;
$$;

create or replace function cleanup_old_skips()
returns void language sql as $$
  delete from skipped_recommendations where skipped_date < current_date - interval '1 day';
$$;

-- Helper view
create or replace view today_habits as
select h.id, h.user_id, h.name, h.description, h.time_of_day, h.frequency,
  h.custom_days, h.streak, h.is_active,
  case when hc.id is not null then true else false end as completed_today
from habits h
left join habit_completions hc on h.id = hc.habit_id and hc.completed_date = current_date
where h.is_active = true;

-- ============================================================
-- Done! Re-run setup in Supabase SQL Editor.
-- NOTE: Existing users must be re-created (auth.users triggers profile + scores init).
-- For existing auth users, manually run:
--   INSERT INTO profiles (id, email) SELECT id, email FROM auth.users ON CONFLICT DO NOTHING;
--   INSERT INTO life_area_scores (user_id, area)
--     SELECT u.id, a.area FROM auth.users u CROSS JOIN (VALUES ('intellectual'),('mental'),('spiritual'),('financial'),('physical'),('social')) a(area) ON CONFLICT DO NOTHING;
--   INSERT INTO user_settings (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
-- ============================================================
