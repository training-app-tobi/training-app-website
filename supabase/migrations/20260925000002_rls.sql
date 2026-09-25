-- Row Level Security: the database, not the app, decides who can read and write each row.
--
-- Rules
--   * Signed-out visitors (anon) get nothing.
--   * Signed-in users can read everything public plus their own private rows.
--   * Only the owner can create, change, or delete their rows.
--   * Built-in exercises/tests are read-only (only migrations write them).
--
-- Privileges are granted explicitly (and column by column where it matters), so that
-- even with a policy mistake a user cannot set columns like owner_id or is_built_in.

-- ---------------------------------------------------------------------------
-- Baseline: enable RLS everywhere and remove Supabase's default broad grants.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.test_types enable row level security;
alter table public.plans enable row level security;
alter table public.plan_blocks enable row level security;
alter table public.plan_weeks enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_day_items enable row level security;
alter table public.schedules enable row level security;
alter table public.scheduled_sessions enable row level security;
alter table public.session_logs enable row level security;
alter table public.logged_exercises enable row level security;
alter table public.test_results enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;

-- New objects in public should not be exposed by default either.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (username, display_name, bodyweight_kg) on public.profiles to authenticated;

create policy "profiles are visible to signed-in users"
  on public.profiles for select to authenticated
  using (true);

create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- exercises / test_types: definitions are readable by everyone signed in.
-- Custom rows are archived rather than deleted so plans and logs keep working.
-- ---------------------------------------------------------------------------
grant select on public.exercises to authenticated;
grant insert (name, category, description) on public.exercises to authenticated;
grant update (name, category, description, archived_at) on public.exercises to authenticated;

create policy "exercises are visible to signed-in users"
  on public.exercises for select to authenticated
  using (true);

create policy "users create their own exercises"
  on public.exercises for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_built_in);

create policy "users update their own exercises"
  on public.exercises for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and not is_built_in);

grant select on public.test_types to authenticated;
grant insert (name, category, unit, higher_is_better, protocol) on public.test_types to authenticated;
grant update (name, category, unit, higher_is_better, protocol, archived_at) on public.test_types to authenticated;

create policy "test types are visible to signed-in users"
  on public.test_types for select to authenticated
  using (true);

create policy "users create their own test types"
  on public.test_types for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_built_in);

create policy "users update their own test types"
  on public.test_types for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and not is_built_in);

-- ---------------------------------------------------------------------------
-- plans
-- ---------------------------------------------------------------------------
grant select, delete on public.plans to authenticated;
grant insert (title, description, goal, visibility, source_plan_id) on public.plans to authenticated;
grant update (title, description, goal, visibility) on public.plans to authenticated;

create policy "plans are visible if public or owned"
  on public.plans for select to authenticated
  using (visibility = 'public' or owner_id = (select auth.uid()));

-- A plans policy cannot query public.plans itself (infinite recursion), so the
-- "can the caller see the source plan" check lives in a helper outside the API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.can_see_plan(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.plans p
     where p.id = p_plan_id
       and (p.visibility = 'public' or p.owner_id = (select auth.uid()))
  );
$$;
revoke all on function private.can_see_plan(uuid) from public;
grant execute on function private.can_see_plan(uuid) to authenticated;

create policy "users create their own plans"
  on public.plans for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    -- A copy may only reference a plan the user is allowed to see.
    and (source_plan_id is null or private.can_see_plan(source_plan_id))
  );

create policy "users update their own plans"
  on public.plans for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "users delete their own plans"
  on public.plans for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- plan children: readable when the parent plan is readable, writable by its owner.
-- The subquery on public.plans is itself filtered by the plans policy above.
-- (One policy per action, so each action is checked by exactly one policy.)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.plan_blocks to authenticated;
grant select, insert, update, delete on public.plan_weeks to authenticated;
grant select, insert, update, delete on public.plan_days to authenticated;
grant select, insert, update, delete on public.plan_day_items to authenticated;

create policy "plan blocks follow plan visibility"
  on public.plan_blocks for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id));
create policy "plan owners insert blocks"
  on public.plan_blocks for insert to authenticated
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners update blocks"
  on public.plan_blocks for update to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners delete blocks"
  on public.plan_blocks for delete to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));

create policy "plan weeks follow plan visibility"
  on public.plan_weeks for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id));
create policy "plan owners insert weeks"
  on public.plan_weeks for insert to authenticated
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners update weeks"
  on public.plan_weeks for update to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners delete weeks"
  on public.plan_weeks for delete to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));

create policy "plan days follow plan visibility"
  on public.plan_days for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id));
create policy "plan owners insert days"
  on public.plan_days for insert to authenticated
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners update days"
  on public.plan_days for update to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners delete days"
  on public.plan_days for delete to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));

create policy "plan items follow plan visibility"
  on public.plan_day_items for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id));
create policy "plan owners insert items"
  on public.plan_day_items for insert to authenticated
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners update items"
  on public.plan_day_items for update to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "plan owners delete items"
  on public.plan_day_items for delete to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- schedules / scheduled_sessions: visible to others only when the plan is public.
-- Users can only schedule plans they own (copy a plan first to schedule it).
-- ---------------------------------------------------------------------------
grant select, delete on public.schedules to authenticated;
grant insert (plan_id, start_date) on public.schedules to authenticated;

create policy "schedules are visible to owner or when plan is public"
  on public.schedules for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.plans p where p.id = plan_id and p.visibility = 'public')
  );
create policy "users schedule their own plans"
  on public.schedules for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.plans p where p.id = plan_id and p.owner_id = (select auth.uid()))
  );
create policy "users delete their own schedules"
  on public.schedules for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.scheduled_sessions to authenticated;
grant insert (schedule_id, plan_id, plan_day_id, date) on public.scheduled_sessions to authenticated;

create policy "scheduled sessions are visible to owner or when plan is public"
  on public.scheduled_sessions for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.plans p where p.id = plan_id and p.visibility = 'public')
  );
create policy "users create their own scheduled sessions"
  on public.scheduled_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users delete their own scheduled sessions"
  on public.scheduled_sessions for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- session_logs / logged_exercises
-- ---------------------------------------------------------------------------
grant select, delete on public.session_logs to authenticated;
grant insert (date, title, scheduled_session_id, duration_min, rpe, notes, visibility)
  on public.session_logs to authenticated;
grant update (date, title, scheduled_session_id, duration_min, rpe, notes, visibility)
  on public.session_logs to authenticated;

create policy "session logs are visible if public or owned"
  on public.session_logs for select to authenticated
  using (visibility = 'public' or user_id = (select auth.uid()));
create policy "users create their own session logs"
  on public.session_logs for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users update their own session logs"
  on public.session_logs for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "users delete their own session logs"
  on public.session_logs for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.logged_exercises to authenticated;
grant insert (log_id, exercise_id, position, sets, reps, duration_sec, load_kg, edge_mm, grade, notes, completed)
  on public.logged_exercises to authenticated;
grant update (exercise_id, position, sets, reps, duration_sec, load_kg, edge_mm, grade, notes, completed)
  on public.logged_exercises to authenticated;

create policy "logged exercises follow log visibility"
  on public.logged_exercises for select to authenticated
  using (exists (select 1 from public.session_logs l where l.id = log_id));
create policy "users create their own logged exercises"
  on public.logged_exercises for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users update their own logged exercises"
  on public.logged_exercises for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "users delete their own logged exercises"
  on public.logged_exercises for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- test_results
-- ---------------------------------------------------------------------------
grant select, delete on public.test_results to authenticated;
grant insert (test_type_id, date, value, bodyweight_kg, notes, visibility, scheduled_session_id)
  on public.test_results to authenticated;
grant update (date, value, bodyweight_kg, notes, visibility)
  on public.test_results to authenticated;

create policy "test results are visible if public or owned"
  on public.test_results for select to authenticated
  using (visibility = 'public' or user_id = (select auth.uid()));
create policy "users create their own test results"
  on public.test_results for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users update their own test results"
  on public.test_results for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "users delete their own test results"
  on public.test_results for delete to authenticated
  using (user_id = (select auth.uid()));
