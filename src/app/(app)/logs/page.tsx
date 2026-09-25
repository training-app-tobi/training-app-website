import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "My sessions" };

const PAGE_SIZE = 30;

export default async function LogsPage({ searchParams }: PageProps<"/logs">) {
  const { supabase, userId } = await requireUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { data: logs, count } = await supabase
    .from("session_logs")
    .select("id, date, title, duration_min, rpe, visibility, scheduled_session_id, logged_exercises(count)", {
      count: "exact",
    })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="My sessions"
        description={`${count ?? 0} sessions logged`}
        actions={
          <Link href="/logs/new" className="btn-primary">
            Log session
          </Link>
        }
      />
      {(logs ?? []).length === 0 ? (
        <EmptyState
          action={
            <Link href="/logs/new" className="btn-primary">
              Log your first session
            </Link>
          }
        >
          No sessions yet.
        </EmptyState>
      ) : (
        <div className="card divide-y divide-stone-100 p-0 sm:p-0">
          {logs!.map((log) => (
            <Link
              key={log.id}
              href={`/logs/${log.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{log.title}</div>
                <div className="text-xs text-stone-500">
                  {formatDate(log.date)}
                  {log.duration_min ? ` · ${log.duration_min} min` : ""}
                  {log.rpe ? ` · RPE ${log.rpe}` : ""}
                  {` · ${log.logged_exercises[0]?.count ?? 0} exercises`}
                  {log.scheduled_session_id ? " · from plan" : ""}
                </div>
              </div>
              <VisibilityBadge visibility={log.visibility} />
            </Link>
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-4 flex justify-between text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link className="link" href={`/logs?page=${page - 1}`}>
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-stone-500">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link className="link" href={`/logs?page=${page + 1}`}>
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
