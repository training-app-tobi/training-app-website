# Review: Layout Rules and Walk-Through

The three-part layout from the trial (process, principles, content by step) was adopted on 2026-10-21. A second review the same day used the process notes and the principles to tune it. This file records the rules that came out of it, the whole-note moves, the walk-through used to check the result, and the gaps left for later. The trial's own findings are kept in git history (TRIAL_REVIEW.md before this file replaced it).

## Rules

### Steps

- Ten steps, in the order the process notes give them; [process/STEPS.md](process/STEPS.md) gives each step's decision, output, content folder and principles.
- Step 03, Time and resources, was added because three of the four process notes treat it as a step of its own: program design step 3 ("the time frame and the things available to you"), the timescale and life commitments in step 2 of the 3-steps note, and the lifestyle constraints that come "before any structure" in the 12-week note. Steps 03–09 became 04–10.
- Load and recovery stays before exercises: program design sets reps or time, sets, load, tempo and rest before choosing the exercise.
- Step 01 sorts goals into four types (a climb, a trip or a competition, a grade, a general goal such as "stronger on steep terrain"; the types follow plan_template/goals/INDEX.md), because the type decides how you find what the goal demands: you can research a named climb, but a general goal has to be made measurable first. [Process Versus Outcome Goals](content/01_climbing_goal/process-versus-outcome-goals.md) sits in step 01 for the same reason: the first step of its method is that demand list for a grade or a general goal. Step 04 uses its steps 2 and 3.

### Parts

- `process/`: the steps and the notes that describe the whole method.
- `principles/`: rules that hold across steps (`whole_plan/`) or for one quality.
- `content/`: the material each step chooses from, one folder per step.

### Sessions and exercises

- `07_sessions/` holds what a whole session is for and how its parts fit: session types for open sessions (what the session is for and how to judge it), templates that arrange several parts, warm-ups, and the rules for building a session (`session_design/`).
- `09_exercises/` holds one exercise, drill or workout with a set dose (reps or time, sets, load, rest) and its progression, placed as the main part or one part of a session, however long it is.
- Test for a borderline note: a set dose for one activity makes it an exercise; no set dose, with a purpose or a metric or an arrangement of parts, makes it a session. The 12-week plan uses 6-in-6, 1 On 1 Off and ARC as parts of sessions.
- Off-the-wall routines stay with their siblings: hangboard and weights sessions in sessions, antagonist and core routines in exercises.

### When to split

- Move a section when it is a complete prescription another step chooses from: a protocol goes to exercises, a test or benchmark to assessment, a block or season shape to periodization, a session template to sessions. Also move a substantial answer to another step's question.
- Keep a one-line mention, or a section that is the note's main point, where it is; STEPS.md points to it.
- One new note per target folder; an emptied original is deleted; notes don't link to each other, but a plain-text "see the note X" is fine.
- Moved text keeps all its content (facts, numbers, conditions, warnings). Where the original wording would read out of context in its new note, it is reworded; the same goes for the trimmed original.

### Folders

- One quality order everywhere: finger strength, strength and pulling, power, power endurance, endurance, technique and skill, mobility, antagonists and core.
- Audience subfolders (general, boulder, sport, beginner, young, old, female, injured) appear once a folder has audience-specific notes, and a folder goes flat again when its last one leaves. A note goes in an audience subfolder when its For field names that audience alone.
- `08_load_and_recovery/` follows the step's three outputs: `intensity/`, `progression/`, `recovery/`.

## Round 2 changes

Splits are in [SPLIT_NOTES.md](SPLIT_NOTES.md). The whole-note moves (text unchanged apart from the Type tag of four workouts) were:

| Change | Notes | Now in |
|---|---|---|
| Steps renumbered | every note in the old steps 03–09 | `content/04_…` to `content/10_…` |
| Sessions by quality | [Adaptive Hangboard Session](content/07_sessions/finger_strength/general/adaptive-hangboard-session.md), [Hangboard Routine to Combine With Climbing on the Same Day](content/07_sessions/finger_strength/general/hangboard-routine-to-combine-with-climbing-on-the-same-day.md), [Home Fingerboard Session](content/07_sessions/finger_strength/general/home-fingerboard-session.md), [Two Fingerboard Sessions a Week Before a Bouldering Trip](content/07_sessions/finger_strength/boulder/two-fingerboard-sessions-a-week-before-a-bouldering-trip.md) | `07_sessions/finger_strength/` |
| | [A Minimalist Strength Routine for Climbers](content/07_sessions/strength_and_pulling/general/a-minimalist-strength-routine-for-climbers.md), [Full Combination Strength](content/07_sessions/strength_and_pulling/general/full-combination-strength.md), [General Strength Sessions](content/07_sessions/strength_and_pulling/general/general-strength-sessions.md), [A Weights-Gym Session Before a Bouldering Trip](content/07_sessions/strength_and_pulling/boulder/a-weights-gym-session-before-a-bouldering-trip.md) | `07_sessions/strength_and_pulling/` |
| | both Integrated Strength notes | `07_sessions/combined/general/` |
| Rules for building a session | [Weights Before or After Climbing](content/07_sessions/session_design/general/weights-before-or-after-climbing.md), [How to Structure Your Training](content/07_sessions/session_design/general/how-to-structure-your-training.md) (from weekly structure), [Power Training When Power Is a Weakness](content/07_sessions/session_design/general/power-training-when-power-is-a-weakness.md) (from principles), [Bouldering Session Order](content/07_sessions/session_design/boulder/bouldering-session-order.md) | `07_sessions/session_design/` |
| Workouts on the wall | [ARC Long](content/09_exercises/endurance/arc-long.md), [Training Endurance on a System Board](content/09_exercises/endurance/training-endurance-on-a-system-board.md), [Alactic Interval Training](content/09_exercises/power/alactic-interval-training-progression-and-transition.md), [Gym Training Strategies for Route Climbing](content/09_exercises/technique_and_skill/sport/gym-training-strategies-for-route-climbing.md) | `09_exercises/`, Type set to Exercise/protocol |
| Gear folder dissolved | [Kilter Board vs Tension Board 2](content/03_time_and_resources/kilter-board-vs-tension-board-2-grade-by-grade-comparison.md), [Why Climb on a Training Board](content/03_time_and_resources/why-climb-on-a-training-board.md), [A 60° Board for Foot Tension in Volume Sessions](content/03_time_and_resources/a-60-degree-board-for-foot-tension-in-volume-sessions.md) | `03_time_and_resources/` |
| | [How Often to Use a Training Board](content/06_weekly_structure/how-often-to-use-a-training-board.md) | `06_weekly_structure/` |
| Audience fixes | [No-Hang Finger Strength Testing](content/02_assessment/injured/no-hang-finger-strength-testing.md) · [Warming Up the Fingers on a Fingerboard](content/07_sessions/warm_up/beginner/warming-up-the-fingers-on-a-fingerboard.md) · [Skill Practice in the First 20–30 Minutes of Climbing](content/07_sessions/technique_and_skill/beginner/skill-practice-in-the-first-20-30-minutes-of-climbing.md) · [Five Flexibility Stretches for the Warm-Up](content/07_sessions/mobility/beginner/five-flexibility-stretches-for-the-warm-up.md) · [Simple Supplementary Strength](content/09_exercises/strength_and_pulling/beginner/simple-supplementary-strength.md) · [Use RPE and the Intention of the Session](content/08_load_and_recovery/intensity/female/use-rpe-and-the-intention-of-the-session.md) | the audience subfolder named in their For field |
| Load subfolders | the 26 load and recovery notes | `intensity/`, `progression/`, `recovery/` |
| Folders flattened or split | the weekly structure notes (its only boulder note moved to sessions); the warm-ups, strength and pulling exercises and technique exercises (now with `general/` beside the new audience subfolders) | as shown in INDEX.md |

The same round also fixed wording that read out of context in the round-1 splits, for example a heading "Other ways to perform" left over from the note it came from, and pointers to notes that had been retitled.

After round 2, [Process Versus Outcome Goals](content/01_climbing_goal/process-versus-outcome-goals.md) moved from step 04 to step 01 (see Steps above), and step 01 of STEPS.md gained the goal types.

## Walk-through

The two cases from the trial were walked through the ten steps again, using only this folder. Case C, a general goal with no named climb, was added after round 2. Areas are counted as before: each content step folder counts as one, `principles/` counts as one, and the process notes are read once at the start and not counted. "Original" is the first layout (eight topic folders), "Trial" the nine-step layout before this round.

### Case A: V9 boulderer, 12 weeks to a bouldering trip

The answer key is [Building a 12-Week Training Plan for a Bouldering Trip](process/boulder/building-a-12-week-training-plan-for-a-bouldering-trip.md) and its five split-out notes.

| Step | Where the material is now | Original | Trial | Now |
|---|---|---|---|---|
| 01 Climbing goal | content/01; principles/whole_plan (training to the trip's daily load, how bouldering differs) | 3 | 2 | 2 |
| 02 Assessment | content/02 (starting-point tests, grade predictors, 10 mm hangboard test, mobility tests) | 1 | 1 | 1 |
| 03 Time and resources | content/03 (boards); the work schedule and weekend climbing come from the process note | — | — | 1 |
| 04 Training focus | content/04 (test review, intermediate and training goals); principles (focus rules, finger fatigability, endurance and mobility for boulderers) | 6 | 2 | 2 |
| 05 Periodization | content/05 (self-written format, general-specific-simulation year, the trip taper); principles | 3 | 3 | 2 |
| 06 Weekly structure | content/06 (D/M/R, outdoor days as high-load sessions, board days); principles (green days) | 2 | 2 | 2 |
| 07 Sessions | content/07 (two fingerboard sessions, the weights-gym session, mobility in the warm-up, session order); content/09 (6-in-6, 1 On 1 Off and ARC, the parts of the climbing sessions) | 2 | 2 | 2 |
| 08 Load and recovery | content/08 (RPE, deloads); principles (maximum-strength dose); content/02 (loads from the max hang score) | 3 | 3 | 3 |
| 09 Exercises | content/09 (workouts, finger protocols, shoulder and core conditioning) | 1 | 1 | 1 |
| 10 Check and review | content/10 | 3 | 1 | 1 |
| **Total** | | **24** | **17** | **17** |

### Case B: self-coached sport climber, goal route in 6 months, 3–4 days a week

There is no answer key in the knowledge base, so this case tests coverage.

| Step | Where the material is now | Original | Trial | Now |
|---|---|---|---|---|
| 01 Climbing goal | content/01; principles (goal demands, pacing and recruitment, the endurance spectrum) | 4 | 2 | 2 |
| 02 Assessment | content/02 (7:3 repeaters, stamina hang, fatigue curve, route pyramids, strength standards) | 1 | 1 | 1 |
| 03 Time and resources | content/03 (6 months, 3–4 days a week, facilities, busy-schedule options) | — | — | 1 |
| 04 Training focus | content/04 (antistyle, training goals); principles (aerobic system, capacity and power, power endurance) | 6 | 2 | 2 |
| 05 Periodization | content/05 (self-written format, alternating linear periodization, the 8-8-8 plan, the trip taper); principles (aerobic phases, the endurance spectrum by season) | 3 | 3 | 2 |
| 06 Weekly structure | content/06 (frequency, endurance sessions per week for route climbers); principles | 2 | 2 | 2 |
| 07 Sessions | content/07 (session design); content/09 (aerobic endurance workouts, route-climbing gym drills) | 1 | 2 | 2 |
| 08 Load and recovery | content/08 (the four ways to progress endurance, work capacity, RPE, deloads); principles (volume at one intensity for a month before raising it) | 2 | 2 | 2 |
| 09 Exercises | content/09 (endurance intervals, power endurance protocols, technique drills) | 1 | 1 | 1 |
| 10 Check and review | content/10 | 3 | 1 | 1 |
| **Total** | | **23** | **16** | **16** |

### Case C: boulderer with a general goal, stronger on steep terrain in 4 months

There is no named climb to research, so the goal has to be made measurable first. There is no answer key either, so this case tests coverage.

| Step | Where the material is now | Now |
|---|---|---|
| 01 Climbing goal | content/01 (goal rules, the all-round example for splitting a broad goal, the skills a climber who reaches the goal has); principles (angle, hold type and adaptations; end-to-end tension and steep pulling; how bouldering differs). The measurable "after", such as most steep V3s with controlled feet, comes from the 3-steps process note | 2 |
| 02 Assessment | content/02 (starting-point tests, max hang, the midsection standard of knees-to-elbows and a front lever, grade predictors, a "home V4 steep overhang" benchmark problem) | 1 |
| 03 Time and resources | content/03 (a steep board or wall) | 1 |
| 04 Training focus | content/04 (measurable training goals, with the roof and front-lever example; intermediate goals; antistyle); principles (end-to-end tension, steep pulling, bouldering beyond finger strength) | 2 |
| 05 Periodization | content/05 (block formats, strength before power); principles (start general and get more specific; the four-stage steep-climbing progression, over several seasons) | 2 |
| 06 Weekly structure | content/06 (a board day for max strength or power only, D/M/R); principles (green days) | 2 |
| 07 Sessions | content/07 (bouldering session styles; strength sessions with rows, such as the low row "for pulling into steeper terrain"); content/09 (the parts) | 2 |
| 08 Load and recovery | content/08 (RPE, progression, deloads); the upper limit on board and fingerboard volume comes from the 3-steps process note | 1 |
| 09 Exercises | content/09 (foot tension on steep walls, tension sessions, heel and toe hooks, lock-offs, limit and power bouldering) | 1 |
| 10 Check and review | content/10 | 1 |
| **Total** | | **15** |

### Result

- The totals stay at 17 and 16 although there is one more step: the new step 03 adds a visit per case, and the trip taper, now in periodization, saves one.
- Lookups in another step's folder outside the design fell from one (Case A) and two (Case B) to none: the trip taper (both cases) and the route-climber session count (Case B) now sit in the step that needs them. The remaining cross-folder lookups are by design: sessions take their parts from exercises, and load takes its numbers from the test scores.
- Time, schedule and facilities now have a step and a checklist; in the trial they sat only in the process notes.
- Load and recovery reads as three decisions (intensity, progression, recovery), and the power endurance reasoning has its own principles folder.
- Case C takes 15 areas with no lookups outside the design. Before step 01 gained the goal types, it described the demands of a named climb only: the measurable "after" sat in a process note, and the method for the skills a goal needs sat in step 04, a folder ahead. Step 04 now points back to that method's steps 2 and 3, which the plan writer has already read in step 01.

## Gaps left for later

- **Sport climbing:** there are still no grade predictors for routes, few route sessions and two short sport principle notes.
- **Sessions on the wall:** most session templates are off the wall; on-the-wall training is mostly workouts in exercises, which the rule expects, but there are few complete climbing-session templates and only one power session type.
- **General goals:** steep terrain has its own principle notes (end-to-end tension, steep pulling), but no exercise note gives a dose (reps or time, sets, rest) for rotational rows or for tension work on TRX or rings; rows with a dose appear only as parts of strength sessions and circuits, and as the beginner low row. Other terrains, such as slab, vertical walls and cracks, appear only as mentions inside other notes.
- **Near-duplicates kept on purpose:** the two energy-system "gears" notes and the three "four ways to progress endurance" texts come from different source items and each has details the others lack. STEPS.md names each set once.
