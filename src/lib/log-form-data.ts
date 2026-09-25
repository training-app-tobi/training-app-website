import "server-only";
import type { LogExerciseRow, LogFormValues } from "@/components/log-form";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { isISODate, todayISO } from "@/lib/dates";

const str = (v: number | string | null) => (v === null ? "" : String(v));

/** Initial values for a new log, pre-filled from a planned session when one is given. */
export async function newLogValues(
  supabase: SupabaseServerClient,
  userId: string,
  opts: { sessionId?: string; date?: string },
): Promise<{ values: LogFormValues; plannedLabel?: string }> {
  const values: LogFormValues = {
    date: opts.date && isISODate(opts.date) ? opts.date : todayISO(),
    title: "",
    scheduled_session_id: null,
    duration_min: "",
    rpe: "",
    notes: "",
    visibility: "public",
    exercises: [],
  };
  if (!opts.sessionId) return { values };

  const { data: session } = await supabase
    .from("scheduled_sessions")
    .select(
      `id, date, plan_days(title, plans(title),
      plan_day_items(position, exercise_id, sets, reps, duration_sec, load_kg, edge_mm, grade, notes))`,
    )
    .eq("id", opts.sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session?.plan_days) return { values };

  const items = [...session.plan_days.plan_day_items].sort((a, b) => a.position - b.position);
  values.date = session.date;
  values.title = session.plan_days.title;
  values.scheduled_session_id = session.id;
  values.exercises = items
    .filter((i) => i.exercise_id)
    .map<LogExerciseRow>((i) => ({
      key: crypto.randomUUID(),
      exercise_id: i.exercise_id!,
      sets: str(i.sets),
      reps: str(i.reps),
      duration_sec: str(i.duration_sec),
      load_kg: str(i.load_kg),
      edge_mm: str(i.edge_mm),
      grade: i.grade ?? "",
      notes: "",
      completed: true,
    }));
  return { values, plannedLabel: `${session.plan_days.title} (${session.plan_days.plans?.title ?? "plan"})` };
}
