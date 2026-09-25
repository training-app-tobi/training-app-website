import "server-only";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { formatTestValue } from "@/lib/format";
import type { DayKind, TestUnit, Visibility } from "@/lib/types";

// All queries run as the signed-in user; RLS decides what comes back.

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
export type CalendarEntry =
  | {
      kind: "planned";
      id: string;
      date: string;
      title: string;
      dayKind: DayKind;
      planId: string;
      planTitle: string;
      done: boolean;
    }
  | { kind: "log"; id: string; date: string; title: string; visibility: Visibility }
  | { kind: "test"; id: string; date: string; title: string; value: string; visibility: Visibility };

export async function getCalendarEntries(
  supabase: SupabaseServerClient,
  userId: string,
  start: string,
  end: string,
): Promise<CalendarEntry[]> {
  const [sessions, logs, tests] = await Promise.all([
    supabase
      .from("scheduled_sessions")
      .select("id, date, plan_id, plan_days(title, kind, plans(title))")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("session_logs")
      .select("id, date, title, visibility, scheduled_session_id")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("test_results")
      .select("id, date, value, visibility, scheduled_session_id, test_types(name, unit)")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end),
  ]);

  const done = new Set<string>();
  for (const row of [...(logs.data ?? []), ...(tests.data ?? [])]) {
    if (row.scheduled_session_id) done.add(row.scheduled_session_id);
  }

  const entries: CalendarEntry[] = [];
  for (const s of sessions.data ?? []) {
    entries.push({
      kind: "planned",
      id: s.id,
      date: s.date,
      title: s.plan_days?.title ?? "Session",
      dayKind: s.plan_days?.kind ?? "training",
      planId: s.plan_id,
      planTitle: s.plan_days?.plans?.title ?? "",
      done: done.has(s.id),
    });
  }
  for (const l of logs.data ?? []) {
    entries.push({ kind: "log", id: l.id, date: l.date, title: l.title, visibility: l.visibility });
  }
  for (const t of tests.data ?? []) {
    entries.push({
      kind: "test",
      id: t.id,
      date: t.date,
      title: t.test_types?.name ?? "Test",
      value: t.test_types ? formatTestValue(t.test_types.unit, Number(t.value)) : String(t.value),
      visibility: t.visibility,
    });
  }
  const order = { planned: 0, log: 1, test: 2 };
  return entries.sort((a, b) => a.date.localeCompare(b.date) || order[a.kind] - order[b.kind]);
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------
const PLAN_TREE_SELECT = `
  id, title, description, goal, visibility, owner_id, source_plan_id, created_at, updated_at,
  owner:profiles(username, display_name),
  plan_blocks(id, position, name, focus,
    plan_weeks(id, position,
      plan_days(id, weekday, kind, title, notes,
        plan_day_items(id, position, exercise_id, test_type_id, sets, reps, duration_sec, rest_sec,
          load_kg, edge_mm, grade, notes,
          exercises(name, category), test_types(name, unit)))))
` as const;

export async function getPlanTree(supabase: SupabaseServerClient, planId: string) {
  const { data } = await supabase.from("plans").select(PLAN_TREE_SELECT).eq("id", planId).maybeSingle();
  if (!data) return null;

  const blocks = [...data.plan_blocks]
    .sort((a, b) => a.position - b.position)
    .map((block) => ({
      ...block,
      weeks: [...block.plan_weeks]
        .sort((a, b) => a.position - b.position)
        .map((week) => ({
          ...week,
          days: [...week.plan_days]
            .sort((a, b) => a.weekday - b.weekday)
            .map((day) => ({
              ...day,
              items: [...day.plan_day_items].sort((a, b) => a.position - b.position),
            })),
        })),
    }));

  const totalWeeks = blocks.reduce((n, b) => n + b.weeks.length, 0);
  return { ...data, blocks, totalWeeks };
}

export type PlanTree = NonNullable<Awaited<ReturnType<typeof getPlanTree>>>;

// ---------------------------------------------------------------------------
// Exercise / test library
// ---------------------------------------------------------------------------
export type LibraryExercise = { id: string; name: string; category: string; is_built_in: boolean };
export type LibraryTest = { id: string; name: string; unit: TestUnit; category: string; is_built_in: boolean };

/** Built-in definitions plus the user's own (non-archived) custom ones. */
export async function getLibrary(supabase: SupabaseServerClient, userId: string) {
  const [exercises, tests] = await Promise.all([
    supabase
      .from("exercises")
      .select("id, name, category, is_built_in")
      .or(`is_built_in.eq.true,owner_id.eq.${userId}`)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("test_types")
      .select("id, name, unit, category, is_built_in")
      .or(`is_built_in.eq.true,owner_id.eq.${userId}`)
      .is("archived_at", null)
      .order("name"),
  ]);
  return {
    exercises: (exercises.data ?? []) as LibraryExercise[],
    tests: (tests.data ?? []) as LibraryTest[],
  };
}
