-- Core schema for the climbing training app.
-- Access control lives in the RLS migration; this file only defines structure and integrity.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.visibility as enum ('public', 'private');

create type public.exercise_category as enum (
  'finger_strength', 'strength', 'power', 'power_endurance', 'endurance',
  'climbing', 'antagonist', 'mobility', 'other'
);

create type public.test_category as enum ('finger', 'pulling', 'grade', 'other');

create type public.test_unit as enum (
  'kg_added', 'mm', 'reps', 'seconds', 'font_grade', 'french_grade'
);

create type public.day_kind as enum ('training', 'test');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique
    check (username::text ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 60),
  bodyweight_kg numeric(5, 2) check (bodyweight_kg between 20 and 250),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Exercise and test catalog (built-in rows have owner_id null)
-- ---------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  category public.exercise_category not null,
  description text check (char_length(description) <= 2000),
  is_built_in boolean not null default false,
  owner_id uuid default auth.uid() references public.profiles (id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint exercises_owner_matches_built_in check (is_built_in = (owner_id is null))
);
create index exercises_owner_id_idx on public.exercises (owner_id);

create table public.test_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  category public.test_category not null,
  unit public.test_unit not null,
  higher_is_better boolean not null default true,
  protocol text check (char_length(protocol) <= 2000),
  is_built_in boolean not null default false,
  owner_id uuid default auth.uid() references public.profiles (id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint test_types_owner_matches_built_in check (is_built_in = (owner_id is null))
);
create index test_types_owner_id_idx on public.test_types (owner_id);

-- ---------------------------------------------------------------------------
-- Plans: plan -> blocks -> weeks -> days -> items
-- Every child row repeats plan_id, and composite foreign keys guarantee that a
-- child always belongs to the same plan as its parent.
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 5000),
  goal text check (char_length(goal) <= 300),
  visibility public.visibility not null default 'public',
  source_plan_id uuid references public.plans (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_owner_id_idx on public.plans (owner_id);
create index plans_source_plan_id_idx on public.plans (source_plan_id);
create index plans_public_created_idx on public.plans (created_at desc) where visibility = 'public';
create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

create table public.plan_blocks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  position smallint not null check (position between 0 and 51),
  name text not null check (char_length(name) between 1 and 80),
  focus text check (char_length(focus) <= 300),
  unique (id, plan_id)
);
create index plan_blocks_plan_id_idx on public.plan_blocks (plan_id);

create table public.plan_weeks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  block_id uuid not null,
  position smallint not null check (position between 0 and 51),
  unique (id, plan_id),
  foreign key (block_id, plan_id) references public.plan_blocks (id, plan_id) on delete cascade
);
create index plan_weeks_plan_id_idx on public.plan_weeks (plan_id);
create index plan_weeks_block_id_idx on public.plan_weeks (block_id, plan_id);

create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  week_id uuid not null,
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1 = Monday
  kind public.day_kind not null default 'training',
  title text not null check (char_length(title) between 1 and 80),
  notes text check (char_length(notes) <= 2000),
  unique (id, plan_id),
  constraint plan_days_one_per_weekday unique (week_id, weekday) deferrable initially deferred,
  foreign key (week_id, plan_id) references public.plan_weeks (id, plan_id) on delete cascade
);
create index plan_days_plan_id_idx on public.plan_days (plan_id);
create index plan_days_week_id_idx on public.plan_days (week_id, plan_id);

create table public.plan_day_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  day_id uuid not null,
  position smallint not null check (position between 0 and 99),
  exercise_id uuid references public.exercises (id) on delete set null,
  test_type_id uuid references public.test_types (id) on delete set null,
  sets smallint check (sets between 1 and 100),
  reps smallint check (reps between 1 and 1000),
  duration_sec integer check (duration_sec between 1 and 86400),
  rest_sec integer check (rest_sec between 0 and 86400),
  load_kg numeric(6, 2) check (load_kg between -200 and 500),
  edge_mm numeric(4, 1) check (edge_mm between 3 and 100),
  grade text check (char_length(grade) <= 10),
  notes text check (char_length(notes) <= 1000),
  -- At most one target; both become null only if the referenced definition is deleted.
  constraint plan_day_items_single_target check (num_nonnulls(exercise_id, test_type_id) <= 1),
  foreign key (day_id, plan_id) references public.plan_days (id, plan_id) on delete cascade
);
create index plan_day_items_plan_id_idx on public.plan_day_items (plan_id);
create index plan_day_items_day_id_idx on public.plan_day_items (day_id, plan_id);
create index plan_day_items_exercise_id_idx on public.plan_day_items (exercise_id);
create index plan_day_items_test_type_id_idx on public.plan_day_items (test_type_id);

-- ---------------------------------------------------------------------------
-- Scheduling: a user schedules one of their own plans from a Monday.
-- Sessions are materialized so they can be shown on the calendar and linked to logs.
-- ---------------------------------------------------------------------------
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  start_date date not null check (extract(isodow from start_date) = 1),
  created_at timestamptz not null default now(),
  unique (id, plan_id, user_id)
);
create index schedules_user_id_idx on public.schedules (user_id);
create index schedules_plan_id_idx on public.schedules (plan_id);

create table public.scheduled_sessions (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null,
  plan_id uuid not null,
  user_id uuid not null default auth.uid(),
  plan_day_id uuid not null,
  date date not null,
  unique (id, user_id),
  foreign key (schedule_id, plan_id, user_id)
    references public.schedules (id, plan_id, user_id) on delete cascade,
  foreign key (plan_day_id, plan_id) references public.plan_days (id, plan_id) on delete cascade
);
create index scheduled_sessions_user_date_idx on public.scheduled_sessions (user_id, date);
create index scheduled_sessions_schedule_id_idx on public.scheduled_sessions (schedule_id, plan_id, user_id);
create index scheduled_sessions_plan_day_id_idx on public.scheduled_sessions (plan_day_id, plan_id);
create index scheduled_sessions_plan_id_idx on public.scheduled_sessions (plan_id);

-- ---------------------------------------------------------------------------
-- Session logs
-- ---------------------------------------------------------------------------
create table public.session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  date date not null,
  title text not null check (char_length(title) between 1 and 120),
  scheduled_session_id uuid,
  duration_min smallint check (duration_min between 1 and 1440),
  rpe smallint check (rpe between 1 and 10),
  notes text check (char_length(notes) <= 5000),
  visibility public.visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  -- A log can only point at one of its author's own scheduled sessions.
  foreign key (scheduled_session_id, user_id)
    references public.scheduled_sessions (id, user_id) on delete set null (scheduled_session_id)
);
create index session_logs_user_date_idx on public.session_logs (user_id, date);
create index session_logs_scheduled_session_idx on public.session_logs (scheduled_session_id, user_id);
create index session_logs_public_created_idx on public.session_logs (created_at desc) where visibility = 'public';
create trigger session_logs_set_updated_at before update on public.session_logs
  for each row execute function public.set_updated_at();

create table public.logged_exercises (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null,
  user_id uuid not null default auth.uid(),
  exercise_id uuid references public.exercises (id) on delete set null,
  position smallint not null check (position between 0 and 99),
  sets smallint check (sets between 1 and 100),
  reps smallint check (reps between 1 and 1000),
  duration_sec integer check (duration_sec between 1 and 86400),
  load_kg numeric(6, 2) check (load_kg between -200 and 500),
  edge_mm numeric(4, 1) check (edge_mm between 3 and 100),
  grade text check (char_length(grade) <= 10),
  notes text check (char_length(notes) <= 1000),
  completed boolean not null default true,
  foreign key (log_id, user_id) references public.session_logs (id, user_id) on delete cascade
);
create index logged_exercises_log_id_idx on public.logged_exercises (log_id, user_id);
create index logged_exercises_exercise_id_idx on public.logged_exercises (exercise_id);

-- ---------------------------------------------------------------------------
-- Test results
-- ---------------------------------------------------------------------------
create table public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  test_type_id uuid not null references public.test_types (id) on delete cascade,
  date date not null,
  value numeric(8, 2) not null check (value between -200 and 100000),
  bodyweight_kg numeric(5, 2) check (bodyweight_kg between 20 and 250),
  notes text check (char_length(notes) <= 2000),
  visibility public.visibility not null default 'public',
  scheduled_session_id uuid,
  created_at timestamptz not null default now(),
  foreign key (scheduled_session_id, user_id)
    references public.scheduled_sessions (id, user_id) on delete set null (scheduled_session_id)
);
create index test_results_user_date_idx on public.test_results (user_id, date);
create index test_results_test_type_id_idx on public.test_results (test_type_id);
create index test_results_scheduled_session_idx on public.test_results (scheduled_session_id, user_id);
create index test_results_public_created_idx on public.test_results (created_at desc) where visibility = 'public';
