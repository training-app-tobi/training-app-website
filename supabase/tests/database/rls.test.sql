-- Row Level Security: user B must never see or change user A's private data,
-- and signed-out visitors (anon) get nothing.
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

-- ---------------------------------------------------------------------------
-- Fixtures (as the migration owner)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@test.dev', '{"username":"user_a"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@test.dev', '{"username":"user_b"}');

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

insert into public.plans (id, owner_id, title, visibility) values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'A public plan', 'public'),
  ('aaaaaaaa-1111-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'A private plan', 'private');
insert into public.plan_blocks (id, plan_id, position, name) values
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 0, 'Public block'),
  ('aaaaaaaa-2222-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000002', 0, 'Private block');
insert into public.plan_weeks (id, plan_id, block_id, position) values
  ('aaaaaaaa-3333-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-2222-4000-8000-000000000001', 0);
insert into public.plan_days (id, plan_id, week_id, weekday, title) values
  ('aaaaaaaa-4444-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-3333-4000-8000-000000000001', 1, 'Monday');
insert into public.schedules (id, user_id, plan_id, start_date) values
  ('aaaaaaaa-5555-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', '2026-01-05');
insert into public.scheduled_sessions (id, schedule_id, plan_id, user_id, plan_day_id, date) values
  ('aaaaaaaa-6666-4000-8000-000000000001', 'aaaaaaaa-5555-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-4444-4000-8000-000000000001', '2026-01-05');
insert into public.session_logs (id, user_id, date, title, visibility) values
  ('aaaaaaaa-7777-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', '2026-01-05', 'A public log', 'public'),
  ('aaaaaaaa-7777-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', '2026-01-06', 'A private log', 'private');
insert into public.logged_exercises (log_id, user_id, position, notes) values
  ('aaaaaaaa-7777-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 0, 'secret');
insert into public.test_results (id, user_id, test_type_id, date, value, visibility)
select 'aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', id, '2026-01-07', 20, 'private'
  from public.test_types where name = 'Max pull-ups';

-- ---------------------------------------------------------------------------
-- Signed-out visitors
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select * from public.plans $$, '42501', null, 'anon cannot read plans');
select throws_ok($$ select * from public.session_logs $$, '42501', null, 'anon cannot read logs');
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon cannot read profiles');
select throws_ok($$ select public.copy_plan('aaaaaaaa-1111-4000-8000-000000000001') $$, '42501', null, 'anon cannot call copy_plan');
select throws_ok($$ select public.save_plan('aaaaaaaa-1111-4000-8000-000000000001', '{}') $$, '42501', null, 'anon cannot call save_plan');
reset role;

-- ---------------------------------------------------------------------------
-- User B reading
-- ---------------------------------------------------------------------------
select pg_temp.login('bbbbbbbb-0000-4000-8000-000000000002');

select results_eq($$ select title from public.plans where owner_id = 'aaaaaaaa-0000-4000-8000-000000000001' order by title $$, array['A public plan'],
  'B sees only A''s public plan');
select is_empty($$ select 1 from public.plan_blocks where plan_id = 'aaaaaaaa-1111-4000-8000-000000000002' $$,
  'B cannot see blocks of A''s private plan');
select isnt_empty($$ select 1 from public.plan_blocks where plan_id = 'aaaaaaaa-1111-4000-8000-000000000001' $$,
  'B can see blocks of A''s public plan');
select results_eq($$ select title from public.session_logs where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$, array['A public log'],
  'B sees only A''s public log');
select is_empty($$ select 1 from public.logged_exercises where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'B cannot see exercises of A''s private log');
select is_empty($$ select 1 from public.test_results where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$, 'B cannot see A''s private test result');
select isnt_empty($$ select 1 from public.scheduled_sessions where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'B can see sessions scheduled from A''s public plan');

-- ---------------------------------------------------------------------------
-- User B writing to A's data
-- ---------------------------------------------------------------------------
update public.plans set title = 'hacked' where id = 'aaaaaaaa-1111-4000-8000-000000000001';
delete from public.plans where id = 'aaaaaaaa-1111-4000-8000-000000000001';
update public.session_logs set title = 'hacked' where id = 'aaaaaaaa-7777-4000-8000-000000000001';
delete from public.plan_blocks where plan_id = 'aaaaaaaa-1111-4000-8000-000000000001';
update public.profiles set display_name = 'hacked' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.exercises set name = 'hacked' where is_built_in;

select throws_ok($$
  insert into public.plan_blocks (plan_id, position, name)
  values ('aaaaaaaa-1111-4000-8000-000000000001', 1, 'injected') $$,
  '42501', null, 'B cannot add a block to A''s plan');
select throws_ok($$
  insert into public.plans (owner_id, title) values ('aaaaaaaa-0000-4000-8000-000000000001', 'spoofed') $$,
  '42501', null, 'B cannot create a plan owned by A');
select throws_ok($$
  insert into public.exercises (name, category, is_built_in) values ('Fake built-in', 'other', true) $$,
  '42501', null, 'B cannot create built-in exercises');
select throws_ok($$
  insert into public.session_logs (date, title, scheduled_session_id)
  values ('2026-01-05', 'hijack', 'aaaaaaaa-6666-4000-8000-000000000001') $$,
  '23503', null, 'B cannot attach a log to A''s scheduled session');
select throws_ok($$
  insert into public.plans (title, source_plan_id) values ('fake copy', 'aaaaaaaa-1111-4000-8000-000000000002') $$,
  '42501', null, 'B cannot reference A''s private plan as a copy source');
select throws_ok($$ select public.save_plan('aaaaaaaa-1111-4000-8000-000000000001', '{"title":"hacked","blocks":[]}') $$,
  'P0002', null, 'B cannot save A''s plan');
select throws_ok($$ select public.schedule_plan('aaaaaaaa-1111-4000-8000-000000000001', '2026-02-02') $$,
  'P0002', null, 'B cannot schedule A''s plan');
select throws_ok($$ select public.copy_plan('aaaaaaaa-1111-4000-8000-000000000002') $$,
  'P0002', null, 'B cannot copy A''s private plan');
select throws_ok($$ select public.unschedule('aaaaaaaa-5555-4000-8000-000000000001') $$,
  'P0002', null, 'B cannot unschedule A''s schedule');

-- B's own plan cannot borrow A's block through a crafted week row.
insert into public.plans (title) values ('B plan');
select throws_ok($$
  insert into public.plan_weeks (plan_id, block_id, position)
  select id, 'aaaaaaaa-2222-4000-8000-000000000001', 0 from public.plans
   where title = 'B plan' and owner_id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  '23503', null, 'B cannot attach a week to A''s block');

select isnt(public.copy_plan('aaaaaaaa-1111-4000-8000-000000000001'), null, 'B can copy A''s public plan');

reset role;

-- ---------------------------------------------------------------------------
-- Nothing of A's changed
-- ---------------------------------------------------------------------------
select is((select title from public.plans where id = 'aaaaaaaa-1111-4000-8000-000000000001'), 'A public plan',
  'A''s plan title unchanged and not deleted');
select is((select title from public.session_logs where id = 'aaaaaaaa-7777-4000-8000-000000000001'), 'A public log',
  'A''s log unchanged');
select is((select count(*)::int from public.plan_blocks where plan_id = 'aaaaaaaa-1111-4000-8000-000000000001'), 1,
  'A''s blocks not deleted');
select is((select display_name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'), null,
  'A''s profile unchanged');
select is((select count(*)::int from public.exercises where name = 'hacked'), 0, 'built-in exercises unchanged');
select is((select owner_id from public.plans where source_plan_id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  'bbbbbbbb-0000-4000-8000-000000000002'::uuid, 'the copy belongs to B');

select * from finish();
rollback;
