-- Database functions: sign-up profile trigger, save_plan, schedule_plan, unschedule, copy_plan.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ---------------------------------------------------------------------------
-- Sign-up trigger
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-0000-4000-8000-000000000001', 'c@test.dev', '{"username":"Crimper","display_name":"  Chris  "}');

select is((select username::text from public.profiles where id = 'cccccccc-0000-4000-8000-000000000001'), 'Crimper',
  'profile created with requested username');
select is((select display_name from public.profiles where id = 'cccccccc-0000-4000-8000-000000000001'), 'Chris',
  'display name is trimmed');
select throws_ok($$
  insert into auth.users (id, email, raw_user_meta_data)
  values ('cccccccc-0000-4000-8000-000000000002', 'd@test.dev', '{"username":"crimper"}') $$,
  '23505', 'username already taken', 'sign-up with a taken username (any case) is rejected');

insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-0000-4000-8000-000000000003', 'e@test.dev', '{"username":"bad name!"}'),
  ('cccccccc-0000-4000-8000-000000000004', 'g@test.dev', '{}');
select matches((select username::text from public.profiles where id = 'cccccccc-0000-4000-8000-000000000003'),
  '^climber_[0-9a-f]{16}$', 'invalid username falls back to a generated one');
select matches((select username::text from public.profiles where id = 'cccccccc-0000-4000-8000-000000000004'),
  '^climber_[0-9a-f]{16}$', 'missing username falls back to a generated one');

-- ---------------------------------------------------------------------------
-- save_plan + schedule_plan
-- Block 1: 2 weeks (Mon, Thu); Block 2: 1 week (Sat). Start Monday 2026-01-05.
-- ---------------------------------------------------------------------------
insert into public.plans (id, owner_id, title)
values ('cccccccc-1111-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', 'Draft');
select pg_temp.login('cccccccc-0000-4000-8000-000000000001');

select lives_ok($$
  select public.save_plan('cccccccc-1111-4000-8000-000000000001', '{
    "title": "Two blocks", "visibility": "private",
    "blocks": [
      {"id": "cccccccc-2222-4000-8000-000000000001", "name": "Strength", "weeks": [
        {"id": "cccccccc-3333-4000-8000-000000000001", "days": [
          {"id": "cccccccc-4444-4000-8000-000000000001", "weekday": 1, "title": "Hangs",
           "items": [{"id": "cccccccc-5555-4000-8000-000000000001", "sets": 5, "reps": 1, "duration_sec": 10, "edge_mm": 20}]},
          {"id": "cccccccc-4444-4000-8000-000000000002", "weekday": 4, "title": "Limit"}]},
        {"id": "cccccccc-3333-4000-8000-000000000002", "days": [
          {"id": "cccccccc-4444-4000-8000-000000000003", "weekday": 1, "title": "Hangs"},
          {"id": "cccccccc-4444-4000-8000-000000000004", "weekday": 4, "title": "Limit"}]}]},
      {"id": "cccccccc-2222-4000-8000-000000000002", "name": "Test", "weeks": [
        {"id": "cccccccc-3333-4000-8000-000000000003", "days": [
          {"id": "cccccccc-4444-4000-8000-000000000005", "weekday": 6, "kind": "test", "title": "Test day"}]}]}
    ]}'::jsonb)
$$, 'save_plan stores a nested tree');

select is((select title || '/' || visibility from public.plans where id = 'cccccccc-1111-4000-8000-000000000001'),
  'Two blocks/private', 'save_plan updates plan fields');

select throws_ok($$ select public.schedule_plan('cccccccc-1111-4000-8000-000000000001', '2026-01-06') $$,
  '22023', null, 'schedule_plan rejects a start date that is not a Monday');

select isnt(public.schedule_plan('cccccccc-1111-4000-8000-000000000001', '2026-01-05'), null, 'schedule_plan succeeds');

select results_eq($$ select date from public.scheduled_sessions where plan_id = 'cccccccc-1111-4000-8000-000000000001' order by date $$,
  $$ values ('2026-01-05'::date), ('2026-01-08'), ('2026-01-12'), ('2026-01-15'), ('2026-01-24') $$,
  'sessions land on the right dates across blocks');

-- Edit: rename a day, drop the second week of block 1. Kept nodes keep their ids.
select lives_ok($$
  select public.save_plan('cccccccc-1111-4000-8000-000000000001', '{
    "title": "Two blocks", "visibility": "private",
    "blocks": [
      {"id": "cccccccc-2222-4000-8000-000000000001", "name": "Strength", "weeks": [
        {"id": "cccccccc-3333-4000-8000-000000000001", "days": [
          {"id": "cccccccc-4444-4000-8000-000000000001", "weekday": 1, "title": "Max hangs"},
          {"id": "cccccccc-4444-4000-8000-000000000002", "weekday": 4, "title": "Limit"}]}]},
      {"id": "cccccccc-2222-4000-8000-000000000002", "name": "Test", "weeks": [
        {"id": "cccccccc-3333-4000-8000-000000000003", "days": [
          {"id": "cccccccc-4444-4000-8000-000000000005", "weekday": 6, "kind": "test", "title": "Test day"}]}]}
    ]}'::jsonb)
$$, 'save_plan accepts an edited tree');

select is((select count(*)::int from public.plan_weeks where plan_id = 'cccccccc-1111-4000-8000-000000000001'), 2,
  'save_plan deletes weeks missing from the payload');
select is((select count(*)::int from public.plan_day_items where plan_id = 'cccccccc-1111-4000-8000-000000000001'), 0,
  'save_plan deletes items missing from the payload');
select is((select count(*)::int from public.scheduled_sessions where plan_id = 'cccccccc-1111-4000-8000-000000000001'), 3,
  'scheduled sessions of kept days survive the edit; removed days are unscheduled');

-- ---------------------------------------------------------------------------
-- unschedule keeps past and logged sessions
-- ---------------------------------------------------------------------------
select public.schedule_plan('cccccccc-1111-4000-8000-000000000001', date_trunc('week', current_date + 7)::date);
insert into public.session_logs (date, title, scheduled_session_id)
select date, 'done early', id from public.scheduled_sessions
 where plan_id = 'cccccccc-1111-4000-8000-000000000001' and date >= current_date order by date limit 1;

select public.unschedule(id) from public.schedules where plan_id = 'cccccccc-1111-4000-8000-000000000001' and start_date = date_trunc('week', current_date + 7)::date;
select is((select count(*)::int from public.scheduled_sessions
            where plan_id = 'cccccccc-1111-4000-8000-000000000001' and date >= current_date), 1,
  'unschedule removes future sessions except the logged one');

-- ---------------------------------------------------------------------------
-- copy_plan
-- ---------------------------------------------------------------------------
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('dddddddd-0000-4000-8000-000000000001', 'f@test.dev', '{"username":"copier"}');
update public.plans set visibility = 'public' where id = 'cccccccc-1111-4000-8000-000000000001';
select pg_temp.login('dddddddd-0000-4000-8000-000000000001');

select isnt(public.copy_plan('cccccccc-1111-4000-8000-000000000001'), null, 'copy_plan returns the new plan id');
select is(
  (select count(*)::int from public.plan_days d
     join public.plans p on p.id = d.plan_id
    where p.source_plan_id = 'cccccccc-1111-4000-8000-000000000001'),
  3, 'copy_plan copies every day');
select is(
  (select owner_id from public.plans where source_plan_id = 'cccccccc-1111-4000-8000-000000000001'),
  'dddddddd-0000-4000-8000-000000000001'::uuid, 'the copy is owned by the caller and links its source');

select * from finish();
rollback;
