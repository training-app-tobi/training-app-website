import type { Metadata } from "next";
import Link from "next/link";
import { MonthCalendar } from "@/components/month-calendar";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { buildMonthGrid, isMonthKey, monthRange } from "@/lib/calendar";
import { todayISO } from "@/lib/dates";
import { getCalendarEntries } from "@/lib/queries";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { supabase, userId } = await requireUser();
  const { month: monthParam } = await searchParams;
  const today = todayISO();
  const month = typeof monthParam === "string" && isMonthKey(monthParam) ? monthParam : today.slice(0, 7);
  const { start, end } = monthRange(month);
  // A planned session that was logged is shown by its log entry instead.
  const entries = (await getCalendarEntries(supabase, userId, start, end)).filter(
    (e) => !(e.kind === "planned" && e.done),
  );
  const grid = buildMonthGrid(month, entries, today);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Planned sessions from your scheduled plans, what you logged, and your test results."
        actions={
          <>
            <Link href="/logs/new" className="btn-secondary">
              Log session
            </Link>
            <Link href="/tests/new" className="btn-secondary">
              Log test
            </Link>
            <Link href="/plans" className="btn-primary">
              Schedule a plan
            </Link>
          </>
        }
      />
      <MonthCalendar grid={grid} monthHref={(m) => `/calendar?month=${m}`} isOwner />
    </>
  );
}
