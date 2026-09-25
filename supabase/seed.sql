-- Local development seed (run by `supabase db reset`; never run in production).
-- Two demo users, both with password: climbing-demo-1
--   alex@example.com  (@alex) — bouldering plan, scheduled, with logs and tests
--   sam@example.com   (@sam)  — route endurance plan, logs, one private log

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'alex@example.com', extensions.crypt('climbing-demo-1', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"username":"alex","display_name":"Alex Boulder"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'sam@example.com', extensions.crypt('climbing-demo-1', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"username":"sam","display_name":"Sam Crimps"}',
   now(), now(), '', '', '', '');

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now()
  from auth.users
 where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

update public.profiles set bodyweight_kg = 68 where username = 'alex';
update public.profiles set bodyweight_kg = 61 where username = 'sam';

-- Build content as each user so RLS and the app's database functions are exercised.
create function pg_temp.act_as(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.ex(p_name text) returns uuid language sql stable as $$
  select id from public.exercises where name = p_name and is_built_in;
$$;
create function pg_temp.tt(p_name text) returns uuid language sql stable as $$
  select id from public.test_types where name = p_name and is_built_in;
$$;

-- ---------------------------------------------------------------------------
-- Alex: 9-week bouldering plan, scheduled 3 weeks ago
-- ---------------------------------------------------------------------------
begin;
select from pg_temp.act_as('11111111-1111-4111-8111-111111111111');
set local role authenticated;

do $$
declare
  v_plan uuid;
  v_schedule uuid;
  v_base_week jsonb;
  v_strength_week jsonb;
  v_power_week jsonb;
  v_test_week jsonb;
  v_session record;
  v_log uuid;
  v_monday date := date_trunc('week', current_date)::date - 21;
begin
  insert into public.plans (title, description, goal)
  values ('Bouldering strength cycle',
          'Classic linear cycle: build tendon capacity, then max strength, then power, and finish with a test week.',
          'Send my first 7A')
  returning id into v_plan;

  v_base_week := jsonb_build_object('days', jsonb_build_array(
    jsonb_build_object('weekday', 1, 'title', 'Fingers + volume', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Density hangs'), 'sets', 4, 'reps', 3, 'duration_sec', 30, 'rest_sec', 60, 'edge_mm', 20),
      jsonb_build_object('exercise_id', pg_temp.ex('Volume mileage'), 'duration_sec', 3600, 'notes', '30 problems 2–3 grades below max'))),
    jsonb_build_object('weekday', 3, 'title', 'Technique + antagonist', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Technique drills'), 'duration_sec', 1800),
      jsonb_build_object('exercise_id', pg_temp.ex('Push-ups'), 'sets', 3, 'reps', 15),
      jsonb_build_object('exercise_id', pg_temp.ex('Band external rotations'), 'sets', 3, 'reps', 15))),
    jsonb_build_object('weekday', 6, 'title', 'Long session', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('ARC training'), 'sets', 2, 'duration_sec', 1200, 'rest_sec', 600),
      jsonb_build_object('exercise_id', pg_temp.ex('Hip mobility'), 'duration_sec', 900)))));

  v_strength_week := jsonb_build_object('days', jsonb_build_array(
    jsonb_build_object('weekday', 1, 'title', 'Max hangs + pull', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Max hangs'), 'sets', 5, 'reps', 1, 'duration_sec', 10, 'rest_sec', 180, 'edge_mm', 20, 'load_kg', 15),
      jsonb_build_object('exercise_id', pg_temp.ex('Weighted pull-ups'), 'sets', 4, 'reps', 4, 'rest_sec', 180, 'load_kg', 20))),
    jsonb_build_object('weekday', 3, 'title', 'Limit bouldering', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Warm-up climbing'), 'duration_sec', 1200),
      jsonb_build_object('exercise_id', pg_temp.ex('Limit bouldering'), 'duration_sec', 3600, 'grade', '6C+'))),
    jsonb_build_object('weekday', 6, 'title', 'Board + core', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Board limit bouldering'), 'duration_sec', 2700),
      jsonb_build_object('exercise_id', pg_temp.ex('Front lever progression'), 'sets', 5, 'duration_sec', 8, 'rest_sec', 120)))));

  v_power_week := jsonb_build_object('days', jsonb_build_array(
    jsonb_build_object('weekday', 1, 'title', 'Campus', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Campus ladders'), 'sets', 6, 'rest_sec', 180),
      jsonb_build_object('exercise_id', pg_temp.ex('Campus max moves'), 'sets', 4, 'rest_sec', 240))),
    jsonb_build_object('weekday', 4, 'title', 'Projecting', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Projecting'), 'duration_sec', 5400, 'grade', '7A'))),
    jsonb_build_object('weekday', 6, 'title', '4x4s', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('4x4 bouldering'), 'sets', 4, 'rest_sec', 240)))));

  v_test_week := jsonb_build_object('days', jsonb_build_array(
    jsonb_build_object('weekday', 2, 'kind', 'test', 'title', 'Strength tests', 'items', jsonb_build_array(
      jsonb_build_object('test_type_id', pg_temp.tt('Max hang 20 mm / 10 s')),
      jsonb_build_object('test_type_id', pg_temp.tt('Weighted pull-up 1RM')),
      jsonb_build_object('test_type_id', pg_temp.tt('Max pull-ups')))),
    jsonb_build_object('weekday', 6, 'kind', 'test', 'title', 'Grade test', 'items', jsonb_build_array(
      jsonb_build_object('test_type_id', pg_temp.tt('Hardest boulder'))))));

  perform public.save_plan(v_plan, jsonb_build_object(
    'title', 'Bouldering strength cycle',
    'description', 'Classic linear cycle: build tendon capacity, then max strength, then power, and finish with a test week.',
    'goal', 'Send my first 7A',
    'visibility', 'public',
    'blocks', jsonb_build_array(
      jsonb_build_object('name', 'Base', 'focus', 'Tendon capacity, volume, technique',
        'weeks', jsonb_build_array(v_base_week, v_base_week, v_base_week)),
      jsonb_build_object('name', 'Strength', 'focus', 'Max finger and pulling strength',
        'weeks', jsonb_build_array(v_strength_week, v_strength_week, v_strength_week)),
      jsonb_build_object('name', 'Power', 'focus', 'Recruitment and explosive movement',
        'weeks', jsonb_build_array(v_power_week, v_power_week)),
      jsonb_build_object('name', 'Test week', 'focus', 'Measure progress',
        'weeks', jsonb_build_array(v_test_week)))));

  v_schedule := public.schedule_plan(v_plan, v_monday);

  -- Log most past sessions.
  for v_session in
    select s.id, s.date, s.plan_day_id, d.title
      from public.scheduled_sessions s
      join public.plan_days d on d.id = s.plan_day_id
     where s.schedule_id = v_schedule and s.date < current_date
     order by s.date
  loop
    continue when extract(day from v_session.date)::int % 5 = 0; -- a few missed sessions
    insert into public.session_logs (date, title, scheduled_session_id, duration_min, rpe, notes)
    values (v_session.date, v_session.title, v_session.id, 90, 6 + (extract(day from v_session.date)::int % 3),
            'Felt solid. Skin a bit thin by the end.')
    returning id into v_log;

    insert into public.logged_exercises (log_id, exercise_id, position, sets, reps, duration_sec, load_kg, edge_mm, grade)
    select v_log, i.exercise_id, i.position, i.sets, i.reps, i.duration_sec, i.load_kg, i.edge_mm, i.grade
      from public.plan_day_items i
     where i.day_id = v_session.plan_day_id and i.exercise_id is not null;
  end loop;

  -- Test results from the end of the previous cycle and a recent re-test.
  insert into public.test_results (test_type_id, date, value, bodyweight_kg, notes) values
    (pg_temp.tt('Max hang 20 mm / 10 s'), current_date - 70, 12, 68.5, 'Previous cycle'),
    (pg_temp.tt('Weighted pull-up 1RM'), current_date - 70, 22.5, 68.5, 'Previous cycle'),
    (pg_temp.tt('Max pull-ups'), current_date - 70, 14, 68.5, null),
    (pg_temp.tt('Hardest boulder'), current_date - 68, 10, null, '6C+ in the cave'), -- index of 6C+
    (pg_temp.tt('Max hang 20 mm / 10 s'), current_date - 2, 17.5, 68, 'Big jump after base block'),
    (pg_temp.tt('Max pull-ups'), current_date - 2, 16, 68, null);
end $$;
commit;

-- ---------------------------------------------------------------------------
-- Sam: 6-week route endurance plan (not scheduled), logs and tests
-- ---------------------------------------------------------------------------
begin;
select from pg_temp.act_as('22222222-2222-4222-8222-222222222222');
set local role authenticated;

do $$
declare
  v_plan uuid;
  v_week jsonb;
  v_log uuid;
begin
  insert into public.plans (title, description, goal)
  values ('Route endurance 6 weeks', 'Aerobic base into threshold work for sport climbing season.', 'Onsight 7a')
  returning id into v_plan;

  v_week := jsonb_build_object('days', jsonb_build_array(
    jsonb_build_object('weekday', 2, 'title', 'ARC + technique', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('ARC training'), 'sets', 3, 'duration_sec', 900, 'rest_sec', 300),
      jsonb_build_object('exercise_id', pg_temp.ex('Technique drills'), 'duration_sec', 1200))),
    jsonb_build_object('weekday', 4, 'title', 'Threshold intervals', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Threshold intervals'), 'sets', 4, 'duration_sec', 300, 'rest_sec', 300),
      jsonb_build_object('exercise_id', pg_temp.ex('Reverse wrist curls'), 'sets', 3, 'reps', 20))),
    jsonb_build_object('weekday', 7, 'title', 'Outdoor mileage', 'items', jsonb_build_array(
      jsonb_build_object('exercise_id', pg_temp.ex('Volume mileage'), 'grade', '6b', 'notes', '8–10 routes')))));

  perform public.save_plan(v_plan, jsonb_build_object(
    'title', 'Route endurance 6 weeks',
    'description', 'Aerobic base into threshold work for sport climbing season.',
    'goal', 'Onsight 7a',
    'visibility', 'public',
    'blocks', jsonb_build_array(
      jsonb_build_object('name', 'Aerobic base', 'focus', 'Capillarity and movement volume',
        'weeks', jsonb_build_array(v_week, v_week, v_week)),
      jsonb_build_object('name', 'Threshold', 'focus', 'Push the pump threshold',
        'weeks', jsonb_build_array(v_week, v_week, v_week)))));

  insert into public.session_logs (date, title, duration_min, rpe, notes)
  values (current_date - 1, 'Sector session at the crag', 240, 7, 'Onsighted two 6c+ routes, fell on the 7a crux.')
  returning id into v_log;
  insert into public.logged_exercises (log_id, exercise_id, position, grade, notes)
  values (v_log, pg_temp.ex('Volume mileage'), 0, '6c+', '6 routes'),
         (v_log, pg_temp.ex('Projecting'), 1, '7a', '3 goes');

  insert into public.session_logs (date, title, duration_min, rpe, notes, visibility)
  values (current_date - 3, 'Physio rehab session', 45, 3, 'Private note: left ring finger A2 still sore.', 'private');

  insert into public.test_results (test_type_id, date, value, bodyweight_kg, notes) values
    (pg_temp.tt('Hardest route'), current_date - 1, 12, null, '7a redpoint'), -- index of 7a
    (pg_temp.tt('Max hang 20 mm / 10 s'), current_date - 10, 8, 61, null);
end $$;
commit;
