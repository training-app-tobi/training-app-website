import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLog } from "@/actions/logs";
import { ConfirmButton } from "@/components/form-controls";
import { PageHeader, UserLink, VisibilityBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { formatPrescription } from "@/lib/format";

export const metadata: Metadata = { title: "Session" };

export default async function LogPage({ params }: PageProps<"/logs/[id]">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const { data: log } = await supabase
    .from("session_logs")
    .select(
      `id, user_id, date, title, duration_min, rpe, notes, visibility,
      author:profiles(username, display_name),
      scheduled_sessions(plan_id, plan_days(title, plans(title))),
      logged_exercises(id, position, sets, reps, duration_sec, load_kg, edge_mm, grade, notes, completed,
        exercises(name, category))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!log) notFound();

  const isOwner = log.user_id === userId;
  const exercises = [...log.logged_exercises].sort((a, b) => a.position - b.position);
  const planned = log.scheduled_sessions;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {log.title} <VisibilityBadge visibility={log.visibility} />
          </span>
        }
        description={
          <>
            {formatDate(log.date, "EEEE d MMMM yyyy")} · <UserLink profile={log.author} />
            {log.duration_min ? ` · ${log.duration_min} min` : ""}
            {log.rpe ? ` · RPE ${log.rpe}` : ""}
          </>
        }
        actions={
          isOwner && (
            <>
              <Link href={`/logs/${log.id}/edit`} className="btn-secondary">
                Edit
              </Link>
              <ConfirmButton action={deleteLog.bind(null, log.id)} confirm="Delete this session log?">
                Delete
              </ConfirmButton>
            </>
          )
        }
      />

      {planned?.plan_days && (
        <p className="mb-4 text-sm text-stone-600">
          Planned session “{planned.plan_days.title}” from{" "}
          <Link href={`/plans/${planned.plan_id}`} className="link">
            {planned.plan_days.plans?.title ?? "a plan"}
          </Link>
        </p>
      )}

      {log.notes && <div className="card mb-6 text-sm whitespace-pre-line">{log.notes}</div>}

      <section className="card">
        <h2 className="mb-3 font-semibold">Exercises</h2>
        {exercises.length === 0 ? (
          <p className="text-sm text-stone-500">No exercises recorded.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {exercises.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className={`font-medium ${e.completed ? "" : "text-stone-400 line-through"}`}>
                    {e.exercises?.name ?? "Removed exercise"}
                  </div>
                  {formatPrescription(e) && <div className="text-sm text-stone-600">{formatPrescription(e)}</div>}
                  {e.notes && <div className="text-xs text-stone-500 italic">{e.notes}</div>}
                </div>
                {!e.completed && <span className="text-xs text-stone-500">skipped</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
