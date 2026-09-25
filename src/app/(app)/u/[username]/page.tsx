import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MonthCalendar } from "@/components/month-calendar";
import { TestHistory } from "@/components/test-history";
import { EmptyState, PageHeader, Stat, VisibilityBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { buildMonthGrid, isMonthKey, monthRange } from "@/lib/calendar";
import { addDaysISO, formatDate, todayISO } from "@/lib/dates";
import { getCalendarEntries } from "@/lib/queries";
import { getTestRows } from "@/lib/test-rows";
import { usernameSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Climber" };

const TABS = [
  { key: "calendar", label: "Calendar" },
  { key: "logs", label: "Sessions" },
  { key: "tests", label: "Tests" },
  { key: "plans", label: "Plans" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default async function ProfilePage({ params, searchParams }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const { tab: tabParam, month: monthParam } = await searchParams;
  const { supabase, userId } = await requireUser();
  if (!usernameSchema.safeParse(username).success) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bodyweight_kg, created_at")
    .eq("username", username)
    .maybeSingle();
  if (!profile) notFound();

  const isOwner = profile.id === userId;
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : "calendar";
  const today = todayISO();
  const base = `/u/${profile.username}`;

  // Counts only include what the viewer can see (RLS).
  const [logCount, recentCount, planCount, testCount] = await Promise.all([
    supabase.from("session_logs").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase
      .from("session_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("date", addDaysISO(today, -27)),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("owner_id", profile.id),
    supabase.from("test_results").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
  ]);

  return (
    <>
      <PageHeader
        title={profile.display_name || `@${profile.username}`}
        description={
          <>
            @{profile.username} · joined {formatDate(profile.created_at.slice(0, 10), "MMMM yyyy")}
            {isOwner && " · this is you (others only see your public items)"}
          </>
        }
        actions={
          isOwner && (
            <Link href="/settings" className="btn-secondary">
              Edit profile
            </Link>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sessions" value={logCount.count ?? 0} />
        <Stat label="Last 28 days" value={recentCount.count ?? 0} />
        <Stat label="Tests" value={testCount.count ?? 0} />
        <Stat label="Plans" value={planCount.count ?? 0} />
      </div>

      <nav className="mb-6 flex gap-1 border-b border-stone-200" aria-label="Profile sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`${base}?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-accent-600 text-accent-700"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "calendar" && (
        <CalendarTab
          supabase={supabase}
          profileId={profile.id}
          base={base}
          isOwner={isOwner}
          today={today}
          month={typeof monthParam === "string" && isMonthKey(monthParam) ? monthParam : today.slice(0, 7)}
        />
      )}
      {tab === "logs" && <LogsTab supabase={supabase} profileId={profile.id} />}
      {tab === "tests" && <TestsTab supabase={supabase} profileId={profile.id} isOwner={isOwner} />}
      {tab === "plans" && <PlansTab supabase={supabase} profileId={profile.id} />}
    </>
  );
}

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

async function CalendarTab({
  supabase,
  profileId,
  base,
  isOwner,
  today,
  month,
}: {
  supabase: Supabase;
  profileId: string;
  base: string;
  isOwner: boolean;
  today: string;
  month: string;
}) {
  const { start, end } = monthRange(month);
  const entries = (await getCalendarEntries(supabase, profileId, start, end)).filter(
    (e) => !(e.kind === "planned" && e.done),
  );
  const grid = buildMonthGrid(month, entries, today);
  return <MonthCalendar grid={grid} monthHref={(m) => `${base}?tab=calendar&month=${m}`} isOwner={isOwner} />;
}

async function LogsTab({ supabase, profileId }: { supabase: Supabase; profileId: string }) {
  const { data: logs } = await supabase
    .from("session_logs")
    .select("id, date, title, duration_min, rpe, visibility, logged_exercises(count)")
    .eq("user_id", profileId)
    .order("date", { ascending: false })
    .limit(50);
  if (!logs?.length) return <EmptyState>No sessions to show.</EmptyState>;
  return (
    <div className="card divide-y divide-stone-100 p-0 sm:p-0">
      {logs.map((log) => (
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
            </div>
          </div>
          {log.visibility === "private" && <VisibilityBadge visibility="private" />}
        </Link>
      ))}
    </div>
  );
}

async function TestsTab({ supabase, profileId, isOwner }: { supabase: Supabase; profileId: string; isOwner: boolean }) {
  const rows = await getTestRows(supabase, profileId);
  if (!rows.length) return <EmptyState>No test results to show.</EmptyState>;
  return <TestHistory rows={rows} isOwner={isOwner} />;
}

async function PlansTab({ supabase, profileId }: { supabase: Supabase; profileId: string }) {
  const { data: plans } = await supabase
    .from("plans")
    .select("id, title, goal, visibility, plan_weeks(count)")
    .eq("owner_id", profileId)
    .order("updated_at", { ascending: false });
  if (!plans?.length) return <EmptyState>No plans to show.</EmptyState>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Link key={plan.id} href={`/plans/${plan.id}`} className="card block hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold">{plan.title}</span>
            {plan.visibility === "private" && <VisibilityBadge visibility="private" />}
          </div>
          {plan.goal && <p className="mt-1 text-sm text-stone-600">Goal: {plan.goal}</p>}
          <p className="mt-2 text-xs text-stone-500">{plan.plan_weeks[0]?.count ?? 0} weeks</p>
        </Link>
      ))}
    </div>
  );
}
