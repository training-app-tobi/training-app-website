import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogForm, type LogFormValues } from "@/components/log-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLibrary } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit session" };

const str = (v: number | string | null) => (v === null ? "" : String(v));

export default async function EditLogPage({ params }: PageProps<"/logs/[id]/edit">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const [{ data: log }, library] = await Promise.all([
    supabase
      .from("session_logs")
      .select(
        `id, date, title, scheduled_session_id, duration_min, rpe, notes, visibility,
        logged_exercises(position, exercise_id, sets, reps, duration_sec, load_kg, edge_mm, grade, notes, completed,
          exercises(name, category))`,
      )
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle(),
    getLibrary(supabase, userId),
  ]);
  if (!log) notFound();

  const rows = [...log.logged_exercises].sort((a, b) => a.position - b.position).filter((e) => e.exercise_id);
  const exercises = [...library.exercises];
  for (const row of rows) {
    if (row.exercises && !exercises.some((e) => e.id === row.exercise_id)) {
      exercises.push({
        id: row.exercise_id!,
        name: row.exercises.name,
        category: row.exercises.category,
        is_built_in: false,
      });
    }
  }

  const initial: LogFormValues = {
    date: log.date,
    title: log.title,
    scheduled_session_id: log.scheduled_session_id,
    duration_min: str(log.duration_min),
    rpe: str(log.rpe),
    notes: log.notes ?? "",
    visibility: log.visibility,
    exercises: rows.map((e) => ({
      key: crypto.randomUUID(),
      exercise_id: e.exercise_id!,
      sets: str(e.sets),
      reps: str(e.reps),
      duration_sec: str(e.duration_sec),
      load_kg: str(e.load_kg),
      edge_mm: str(e.edge_mm),
      grade: e.grade ?? "",
      notes: e.notes ?? "",
      completed: e.completed,
    })),
  };

  return (
    <>
      <PageHeader title="Edit session" />
      <LogForm logId={log.id} initial={initial} exercises={exercises} />
    </>
  );
}
