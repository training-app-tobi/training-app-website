import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, Stat, VisibilityBadge } from "@/components/ui";
import { getMyProfile, requireUser } from "@/lib/auth";
import { addDaysISO, formatDate, todayISO } from "@/lib/dates";
import { displayName, formatTestValue } from "@/lib/format";
import { getCalendarEntries } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();
  const profile = await getMyProfile();
  const today = todayISO();

  const [entries, recentLogs, recentTests, logCount, planCount] = await Promise.all([
    getCalendarEntries(supabase, userId, addDaysISO(today, -6), addDaysISO(today, 7)),
    supabase
      .from("session_logs")
      .select("id, date, title, rpe, duration_min, visibility")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("test_results")
      .select("id, date, value, test_types(name, unit)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("session_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("date", addDaysISO(today, -27)),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("owner_id", userId),
  ]);

  const planned = entries.filter((e) => e.kind === "planned");
  const todays = planned.filter((e) => e.date === today);
  const upcoming = planned.filter((e) => e.date > today);
  const missed = planned.filter((e) => e.date < today && !e.done);

  return (
    <>
      <PageHeader
        title={`Hi, ${displayName(profile)}`}
        description={formatDate(today, "EEEE d MMMM yyyy")}
        actions={
          <>
            <Link href="/logs/new" className="btn-primary">
              Log session
            </Link>
            <Link href="/tests/new" className="btn-secondary">
              Log test
            </Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sessions (28 days)" value={logCount.count ?? 0} />
        <Stat
          label="Planned this week"
          value={planned.filter((e) => e.date >= today && e.date <= addDaysISO(today, 6)).length}
        />
        <Stat label="Missed (last 7 days)" value={missed.length} />
        <Stat label="My plans" value={planCount.count ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="mb-3 font-semibold">Today</h2>
            {todays.length === 0 ? (
              <p className="text-sm text-stone-600">
                Nothing planned today.{" "}
                <Link href="/plans" className="link">
                  Schedule a plan
                </Link>{" "}
                or{" "}
                <Link href="/logs/new" className="link">
                  log a session
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {todays.map(
                  (e) =>
                    e.kind === "planned" && (
                      <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium">
                            {e.dayKind === "test" ? "🎯 " : ""}
                            {e.title}
                          </div>
                          <div className="truncate text-xs text-stone-500">{e.planTitle}</div>
                        </div>
                        {e.done ? (
                          <span className="text-sm font-medium text-emerald-700">Done ✓</span>
                        ) : (
                          <Link
                            href={e.dayKind === "test" ? `/tests/new?session=${e.id}` : `/logs/new?session=${e.id}`}
                            className="btn-primary"
                          >
                            {e.dayKind === "test" ? "Log tests" : "Log it"}
                          </Link>
                        )}
                      </li>
                    ),
                )}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Next 7 days</h2>
              <Link href="/calendar" className="text-sm link">
                Calendar →
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-stone-600">No upcoming planned sessions.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {upcoming.map(
                  (e) =>
                    e.kind === "planned" && (
                      <li key={e.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                        <span className="w-24 shrink-0 text-stone-500">{formatDate(e.date, "EEE d MMM")}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {e.dayKind === "test" ? "🎯 " : ""}
                          {e.title}
                        </span>
                        <span className="hidden truncate text-xs text-stone-500 sm:inline">{e.planTitle}</span>
                      </li>
                    ),
                )}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent sessions</h2>
              <Link href="/logs" className="text-sm link">
                All →
              </Link>
            </div>
            {(recentLogs.data ?? []).length === 0 ? (
              <EmptyState>No sessions logged yet.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {recentLogs.data!.map((log) => (
                  <li key={log.id}>
                    <Link href={`/logs/${log.id}`} className="block rounded-lg p-2 hover:bg-stone-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{log.title}</span>
                        <VisibilityBadge visibility={log.visibility} />
                      </div>
                      <div className="text-xs text-stone-500">
                        {formatDate(log.date)}
                        {log.rpe ? ` · RPE ${log.rpe}` : ""}
                        {log.duration_min ? ` · ${log.duration_min} min` : ""}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Latest tests</h2>
              <Link href="/tests" className="text-sm link">
                All →
              </Link>
            </div>
            {(recentTests.data ?? []).length === 0 ? (
              <EmptyState>No test results yet.</EmptyState>
            ) : (
              <ul className="space-y-1 text-sm">
                {recentTests.data!.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2">
                    <span className="truncate">{t.test_types?.name}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {t.test_types ? formatTestValue(t.test_types.unit, Number(t.value)) : t.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
