-- Database functions. Everything except the sign-up trigger runs as the calling user
-- (security invoker), so RLS still applies to every statement.

-- ---------------------------------------------------------------------------
-- Sign-up: create a profile for every new auth user.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := new.raw_user_meta_data ->> 'username';
  v_display_name text := left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 60);
begin
  if v_username is null or v_username !~ '^[A-Za-z0-9_]{3,24}$' then
    -- e.g. users created from the dashboard; they can pick a username in settings.
    v_username := 'climber_' || substr(md5(new.id::text), 1, 16);
  elsif exists (
    select 1 from public.profiles p
     where p.username operator(extensions.=) v_username::extensions.citext
  ) then
    -- Aborts the sign-up; the app shows "username taken".
    raise exception 'username already taken' using errcode = '23505';
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, v_display_name);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- save_plan: update plan fields and upsert the whole block/week/day/item tree.
-- Nodes keep their ids so scheduled sessions survive edits; nodes missing from
-- the payload are deleted.
--
-- Payload:
-- { "title", "description", "goal", "visibility",
--   "blocks": [{ "id", "name", "focus",
--     "weeks": [{ "id",
--       "days": [{ "id", "weekday", "kind", "title", "notes",
--         "items": [{ "id", "exercise_id", "test_type_id", "sets", "reps",
--                     "duration_sec", "rest_sec", "load_kg", "edge_mm", "grade", "notes" }] }] }] }] }
-- ---------------------------------------------------------------------------
create function public.save_plan(p_plan_id uuid, p_plan jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_block jsonb;
  v_week jsonb;
  v_day jsonb;
  v_item jsonb;
  v_block_pos bigint;
  v_week_pos bigint;
  v_item_pos bigint;
  v_block_id uuid;
  v_week_id uuid;
  v_day_id uuid;
  v_item_id uuid;
  v_block_ids uuid[] := '{}'::uuid[];
  v_week_ids uuid[] := '{}'::uuid[];
  v_day_ids uuid[] := '{}'::uuid[];
  v_item_ids uuid[] := '{}'::uuid[];
begin
  update public.plans
     set title = p_plan ->> 'title',
         description = nullif(p_plan ->> 'description', ''),
         goal = nullif(p_plan ->> 'goal', ''),
         visibility = coalesce((p_plan ->> 'visibility')::public.visibility, visibility)
   where id = p_plan_id
     and owner_id = (select auth.uid());
  if not found then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;

  for v_block, v_block_pos in
    select value, ordinality - 1 from jsonb_array_elements(coalesce(p_plan -> 'blocks', '[]')) with ordinality
  loop
    v_block_id := coalesce((v_block ->> 'id')::uuid, gen_random_uuid());
    update public.plan_blocks
       set position = v_block_pos, name = v_block ->> 'name', focus = nullif(v_block ->> 'focus', '')
     where id = v_block_id and plan_id = p_plan_id;
    if not found then
      insert into public.plan_blocks (id, plan_id, position, name, focus)
      values (v_block_id, p_plan_id, v_block_pos, v_block ->> 'name', nullif(v_block ->> 'focus', ''));
    end if;
    v_block_ids := v_block_ids || v_block_id;

    for v_week, v_week_pos in
      select value, ordinality - 1 from jsonb_array_elements(coalesce(v_block -> 'weeks', '[]')) with ordinality
    loop
      v_week_id := coalesce((v_week ->> 'id')::uuid, gen_random_uuid());
      update public.plan_weeks
         set block_id = v_block_id, position = v_week_pos
       where id = v_week_id and plan_id = p_plan_id;
      if not found then
        insert into public.plan_weeks (id, plan_id, block_id, position)
        values (v_week_id, p_plan_id, v_block_id, v_week_pos);
      end if;
      v_week_ids := v_week_ids || v_week_id;

      for v_day in
        select value from jsonb_array_elements(coalesce(v_week -> 'days', '[]'))
      loop
        v_day_id := coalesce((v_day ->> 'id')::uuid, gen_random_uuid());
        update public.plan_days
           set week_id = v_week_id,
               weekday = (v_day ->> 'weekday')::smallint,
               kind = coalesce((v_day ->> 'kind')::public.day_kind, 'training'),
               title = v_day ->> 'title',
               notes = nullif(v_day ->> 'notes', '')
         where id = v_day_id and plan_id = p_plan_id;
        if not found then
          insert into public.plan_days (id, plan_id, week_id, weekday, kind, title, notes)
          values (v_day_id, p_plan_id, v_week_id, (v_day ->> 'weekday')::smallint,
                  coalesce((v_day ->> 'kind')::public.day_kind, 'training'),
                  v_day ->> 'title', nullif(v_day ->> 'notes', ''));
        end if;
        v_day_ids := v_day_ids || v_day_id;

        for v_item, v_item_pos in
          select value, ordinality - 1 from jsonb_array_elements(coalesce(v_day -> 'items', '[]')) with ordinality
        loop
          v_item_id := coalesce((v_item ->> 'id')::uuid, gen_random_uuid());
          update public.plan_day_items
             set day_id = v_day_id,
                 position = v_item_pos,
                 exercise_id = (v_item ->> 'exercise_id')::uuid,
                 test_type_id = (v_item ->> 'test_type_id')::uuid,
                 sets = (v_item ->> 'sets')::smallint,
                 reps = (v_item ->> 'reps')::smallint,
                 duration_sec = (v_item ->> 'duration_sec')::integer,
                 rest_sec = (v_item ->> 'rest_sec')::integer,
                 load_kg = (v_item ->> 'load_kg')::numeric,
                 edge_mm = (v_item ->> 'edge_mm')::numeric,
                 grade = nullif(v_item ->> 'grade', ''),
                 notes = nullif(v_item ->> 'notes', '')
           where id = v_item_id and plan_id = p_plan_id;
          if not found then
            insert into public.plan_day_items (
              id, plan_id, day_id, position, exercise_id, test_type_id, sets, reps,
              duration_sec, rest_sec, load_kg, edge_mm, grade, notes
            ) values (
              v_item_id, p_plan_id, v_day_id, v_item_pos,
              (v_item ->> 'exercise_id')::uuid, (v_item ->> 'test_type_id')::uuid,
              (v_item ->> 'sets')::smallint, (v_item ->> 'reps')::smallint,
              (v_item ->> 'duration_sec')::integer, (v_item ->> 'rest_sec')::integer,
              (v_item ->> 'load_kg')::numeric, (v_item ->> 'edge_mm')::numeric,
              nullif(v_item ->> 'grade', ''), nullif(v_item ->> 'notes', '')
            );
          end if;
          v_item_ids := v_item_ids || v_item_id;
        end loop;
      end loop;
    end loop;
  end loop;

  delete from public.plan_day_items where plan_id = p_plan_id and id <> all (v_item_ids);
  delete from public.plan_days where plan_id = p_plan_id and id <> all (v_day_ids);
  delete from public.plan_weeks where plan_id = p_plan_id and id <> all (v_week_ids);
  delete from public.plan_blocks where plan_id = p_plan_id and id <> all (v_block_ids);
end;
$$;

-- ---------------------------------------------------------------------------
-- copy_plan: deep-copy a plan the caller can see into the caller's account.
-- ---------------------------------------------------------------------------
create function public.copy_plan(p_plan_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_src public.plans;
  v_new_plan_id uuid;
  v_block public.plan_blocks;
  v_week public.plan_weeks;
  v_day public.plan_days;
  v_new_block_id uuid;
  v_new_week_id uuid;
  v_new_day_id uuid;
begin
  -- RLS hides private plans of other users, so "not found" covers both cases.
  select * into v_src from public.plans where id = p_plan_id;
  if not found then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;

  insert into public.plans (title, description, goal, visibility, source_plan_id)
  values (v_src.title, v_src.description, v_src.goal, 'public', v_src.id)
  returning id into v_new_plan_id;

  for v_block in
    select * from public.plan_blocks where plan_id = p_plan_id order by position
  loop
    insert into public.plan_blocks (plan_id, position, name, focus)
    values (v_new_plan_id, v_block.position, v_block.name, v_block.focus)
    returning id into v_new_block_id;

    for v_week in
      select * from public.plan_weeks
       where plan_id = p_plan_id and block_id = v_block.id
       order by position
    loop
      insert into public.plan_weeks (plan_id, block_id, position)
      values (v_new_plan_id, v_new_block_id, v_week.position)
      returning id into v_new_week_id;

      for v_day in
        select * from public.plan_days
         where plan_id = p_plan_id and week_id = v_week.id
         order by weekday
      loop
        insert into public.plan_days (plan_id, week_id, weekday, kind, title, notes)
        values (v_new_plan_id, v_new_week_id, v_day.weekday, v_day.kind, v_day.title, v_day.notes)
        returning id into v_new_day_id;

        insert into public.plan_day_items (
          plan_id, day_id, position, exercise_id, test_type_id, sets, reps,
          duration_sec, rest_sec, load_kg, edge_mm, grade, notes
        )
        select v_new_plan_id, v_new_day_id, i.position, i.exercise_id, i.test_type_id,
               i.sets, i.reps, i.duration_sec, i.rest_sec, i.load_kg, i.edge_mm, i.grade, i.notes
          from public.plan_day_items i
         where i.plan_id = p_plan_id and i.day_id = v_day.id;
      end loop;
    end loop;
  end loop;

  return v_new_plan_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- schedule_plan: put one of the caller's plans on their calendar.
-- Session date = start + (weeks in earlier blocks + week index) * 7 + (weekday - 1)
-- ---------------------------------------------------------------------------
create function public.schedule_plan(p_plan_id uuid, p_start_date date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_schedule_id uuid;
  v_count integer;
begin
  if extract(isodow from p_start_date) <> 1 then
    raise exception 'start date must be a Monday' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.plans where id = p_plan_id and owner_id = (select auth.uid())
  ) then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;

  insert into public.schedules (plan_id, start_date)
  values (p_plan_id, p_start_date)
  returning id into v_schedule_id;

  with block_offsets as (
    select b.id,
           coalesce(sum(wc.week_count) over (
             order by b.position rows between unbounded preceding and 1 preceding
           ), 0)::integer as weeks_before
      from public.plan_blocks b
      cross join lateral (
        select count(*) as week_count
          from public.plan_weeks w
         where w.block_id = b.id and w.plan_id = b.plan_id
      ) wc
     where b.plan_id = p_plan_id
  ),
  week_offsets as (
    select w.id,
           bo.weeks_before
             + (row_number() over (partition by w.block_id order by w.position) - 1)::integer
             as week_index
      from public.plan_weeks w
      join block_offsets bo on bo.id = w.block_id
     where w.plan_id = p_plan_id
  )
  insert into public.scheduled_sessions (schedule_id, plan_id, plan_day_id, date)
  select v_schedule_id, p_plan_id, d.id, p_start_date + (wo.week_index * 7 + d.weekday - 1)
    from public.plan_days d
    join week_offsets wo on wo.id = d.week_id
   where d.plan_id = p_plan_id;

  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'plan has no training days to schedule' using errcode = '22023';
  end if;

  return v_schedule_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- unschedule: remove upcoming sessions that have nothing logged against them.
-- Past and logged sessions stay as history; the schedule row goes once empty.
-- ---------------------------------------------------------------------------
create function public.unschedule(p_schedule_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.schedules where id = p_schedule_id and user_id = (select auth.uid())
  ) then
    raise exception 'schedule not found' using errcode = 'P0002';
  end if;

  delete from public.scheduled_sessions s
   where s.schedule_id = p_schedule_id
     and s.user_id = (select auth.uid())
     and s.date >= current_date
     and not exists (select 1 from public.session_logs l where l.scheduled_session_id = s.id)
     and not exists (select 1 from public.test_results t where t.scheduled_session_id = s.id);

  delete from public.schedules sc
   where sc.id = p_schedule_id
     and sc.user_id = (select auth.uid())
     and not exists (select 1 from public.scheduled_sessions s where s.schedule_id = sc.id);
end;
$$;

revoke all on function public.save_plan(uuid, jsonb) from public, anon;
revoke all on function public.copy_plan(uuid) from public, anon;
revoke all on function public.schedule_plan(uuid, date) from public, anon;
revoke all on function public.unschedule(uuid) from public, anon;
grant execute on function public.save_plan(uuid, jsonb) to authenticated;
grant execute on function public.copy_plan(uuid) to authenticated;
grant execute on function public.schedule_plan(uuid, date) to authenticated;
grant execute on function public.unschedule(uuid) to authenticated;
