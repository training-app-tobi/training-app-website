-- Built-in exercise and test catalog. Runs in every environment, including production.
-- Built-ins have owner_id = null, which no RLS policy allows users to write.

insert into public.exercises (name, category, description, is_built_in, owner_id) values
  -- Finger strength
  ('Max hangs', 'finger_strength', 'Short hangs (7–12 s) on an 18–20 mm edge with added weight close to your max. Rest 2–3 min between hangs.', true, null),
  ('Repeaters 7/3', 'finger_strength', '7 s hang / 3 s rest for 6 reps per set on a moderate edge. Rest 2–3 min between sets.', true, null),
  ('Density hangs', 'finger_strength', 'Long hangs (20–40 s) on a comfortable edge to build tendon and connective tissue strength.', true, null),
  ('Min-edge hangs', 'finger_strength', 'Bodyweight hangs on the smallest edge you can hold for about 10 s.', true, null),
  ('No-hangs (block pulls)', 'finger_strength', 'Lift a loaded block or pinch from the floor with one hand for 5–10 s.', true, null),
  ('One-arm hangs', 'finger_strength', 'Assisted or bodyweight one-arm hangs on a large edge. Advanced climbers only.', true, null),
  -- Strength
  ('Weighted pull-ups', 'strength', 'Strict pull-ups with added weight, 3–5 reps per set.', true, null),
  ('Lock-offs', 'strength', 'Hold at the top, 90° and 120° of a pull-up for 3–5 s each.', true, null),
  ('Front lever progression', 'strength', 'Tuck, advanced tuck, straddle or full front lever holds.', true, null),
  ('Deadlift', 'strength', 'Barbell deadlift for posterior chain strength, 3–5 reps per set.', true, null),
  ('Hanging leg raises', 'strength', 'Toes-to-bar or knee raises from a dead hang for core tension.', true, null),
  -- Power
  ('Limit bouldering', 'power', 'Short, maximal boulder attempts at or near your limit. Full rest between attempts.', true, null),
  ('Campus ladders', 'power', 'Ladder up the campus board without feet (e.g. 1-2-3-4-5).', true, null),
  ('Campus max moves', 'power', 'Biggest single campus moves you can control (e.g. 1-5-9).', true, null),
  ('Board limit bouldering', 'power', 'Limit problems on a standardized board (Moon, Kilter, Tension).', true, null),
  -- Power endurance
  ('4x4 bouldering', 'power_endurance', 'Four boulders back to back, four times, with 3–4 min rest between rounds.', true, null),
  ('Linked boulder circuits', 'power_endurance', 'Circuits of 15–30 moves at a hard but sustainable level.', true, null),
  ('Route intervals', 'power_endurance', 'Hard routes or laps with fixed rest (e.g. 1 min on / 1 min off).', true, null),
  -- Endurance
  ('ARC training', 'endurance', 'Continuous easy climbing for 20–45 min, staying below the pump.', true, null),
  ('Volume mileage', 'endurance', 'Many routes or boulders well below your limit to build capacity and movement skill.', true, null),
  ('Threshold intervals', 'endurance', 'Climbing near your pump threshold, e.g. 4–6 min on / 4–6 min off.', true, null),
  -- Climbing
  ('Projecting', 'climbing', 'Working a route or boulder at your limit.', true, null),
  ('Technique drills', 'climbing', 'Silent feet, straight arms, hover hands, flagging and other drills on easy terrain.', true, null),
  ('Warm-up climbing', 'climbing', 'Progressive easy climbing before hard efforts.', true, null),
  -- Antagonist
  ('Push-ups', 'antagonist', 'Standard or weighted push-ups for pushing balance.', true, null),
  ('Shoulder press', 'antagonist', 'Dumbbell or barbell overhead press.', true, null),
  ('Reverse wrist curls', 'antagonist', 'Wrist extensor strengthening with a light dumbbell.', true, null),
  ('Band external rotations', 'antagonist', 'Rotator cuff external rotation with a resistance band.', true, null),
  -- Mobility
  ('Hip mobility', 'mobility', 'Frog stretch, pigeon, deep squat holds and hip openers.', true, null),
  ('Shoulder mobility', 'mobility', 'Band dislocates, wall slides and thoracic rotations.', true, null);

insert into public.test_types (name, category, unit, higher_is_better, protocol, is_built_in, owner_id) values
  ('Max hang 20 mm / 10 s', 'finger', 'kg_added', true,
   'Half-crimp on a 20 mm edge, 10 s hang. Record the added weight in kg (negative if assisted). Warm up well; rest 3 min between attempts.', true, null),
  ('Min edge 10 s', 'finger', 'mm', false,
   'Smallest edge you can hang for 10 s at bodyweight, half-crimp. Record the edge depth in mm.', true, null),
  ('Weighted pull-up 1RM', 'pulling', 'kg_added', true,
   'One strict pull-up from a dead hang, chin over the bar. Record the added weight in kg.', true, null),
  ('Max pull-ups', 'pulling', 'reps', true,
   'Strict pull-ups from a dead hang to chin over the bar, no kipping. Record the number of reps.', true, null),
  ('One-arm lock-off 90°', 'pulling', 'seconds', true,
   'Pull up with two arms, release one hand and hold with the elbow at 90°. Record the weaker side in seconds.', true, null),
  ('Hardest boulder', 'grade', 'font_grade', true,
   'Hardest boulder sent during the block (Font scale).', true, null),
  ('Hardest route', 'grade', 'french_grade', true,
   'Hardest route redpointed during the block (French scale).', true, null);
