import Link from "next/link";
import type { MonthGrid } from "@/lib/calendar";
import { formatDate, WEEKDAYS } from "@/lib/dates";
import type { CalendarEntry } from "@/lib/queries";

type Props = {
  grid: MonthGrid<CalendarEntry>;
  /** Builds the link for a month, e.g. (m) => `/calendar?month=${m}`. */
  monthHref: (month: string) => string;
  /** Owner view links planned sessions to logging; others link to the plan and entries. */
  isOwner: boolean;
};

export function MonthCalendar({ grid, monthHref, isOwner }: Props) {
  const today = grid.weeks.flat().find((d) => d.isToday)?.date ?? new Date().toISOString().slice(0, 10);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{grid.label}</h2>
        <div className="flex gap-1">
          <Link href={monthHref(grid.prevMonth)} className="btn-secondary px-2.5 py-1.5" aria-label="Previous month">
            ←
          </Link>
          <Link href={monthHref(currentMonth())} className="btn-secondary px-2.5 py-1.5">
            Today
          </Link>
          <Link href={monthHref(grid.nextMonth)} className="btn-secondary px-2.5 py-1.5" aria-label="Next month">
            →
          </Link>
        </div>
      </div>

      {/* Desktop: month grid */}
      <div className="hidden overflow-hidden rounded-xl border border-stone-200 bg-stone-200 md:block">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((d) => (
            <div key={d} className="bg-stone-50 px-2 py-1.5 text-xs font-semibold text-stone-500 uppercase">
              {d}
            </div>
          ))}
          {grid.weeks.flat().map((day) => (
            <div
              key={day.date}
              data-date={day.date}
              className={`min-h-28 bg-white p-1.5 ${day.inMonth ? "" : "bg-stone-50/80 text-stone-400"}`}
            >
              <div
                className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  day.isToday ? "bg-accent-600 text-white" : ""
                }`}
              >
                {Number(day.date.slice(8))}
              </div>
              <ul className="space-y-1">
                {day.items.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`}>
                    <EntryChip entry={entry} isOwner={isOwner} today={today} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: agenda list of days that have entries */}
      <div className="space-y-3 md:hidden">
        {grid.weeks
          .flat()
          .filter((day) => day.inMonth && day.items.length > 0)
          .map((day) => (
            <div key={day.date} className="card p-3" data-date={day.date}>
              <div className={`mb-2 text-sm font-semibold ${day.isToday ? "text-accent-700" : ""}`}>
                {formatDate(day.date, "EEEE d MMMM")}
                {day.isToday && " · Today"}
              </div>
              <ul className="space-y-1.5">
                {day.items.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`}>
                    <EntryChip entry={entry} isOwner={isOwner} today={today} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        {grid.weeks.flat().every((day) => !day.inMonth || day.items.length === 0) && (
          <p className="text-sm text-stone-500">Nothing planned or logged this month.</p>
        )}
      </div>

      <Legend />
    </div>
  );
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function entryHref(entry: CalendarEntry, isOwner: boolean): string {
  switch (entry.kind) {
    case "planned":
      if (!isOwner || entry.done) return `/plans/${entry.planId}`;
      return entry.dayKind === "test" ? `/tests/new?session=${entry.id}` : `/logs/new?session=${entry.id}`;
    case "log":
      return `/logs/${entry.id}`;
    case "test":
      return isOwner ? "/tests" : "#";
  }
}

function EntryChip({ entry, isOwner, today }: { entry: CalendarEntry; isOwner: boolean; today: string }) {
  const href = entryHref(entry, isOwner);
  const base = "block truncate rounded-md px-1.5 py-0.5 text-xs leading-5";

  if (entry.kind === "planned") {
    const missed = !entry.done && entry.date < today;
    const style = entry.done
      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
      : missed
        ? "border border-dashed border-red-300 text-red-700 hover:bg-red-50"
        : entry.dayKind === "test"
          ? "border border-dashed border-sky-400 text-sky-800 hover:bg-sky-50"
          : "border border-dashed border-stone-400 text-stone-700 hover:bg-stone-50";
    return (
      <Link
        href={href}
        className={`${base} ${style}`}
        title={`${entry.planTitle}: ${entry.title}${entry.done ? " (done)" : missed ? " (missed)" : isOwner ? " (click to log)" : ""}`}
        data-kind="planned"
      >
        {entry.done ? "✓ " : entry.dayKind === "test" ? "🎯 " : ""}
        {entry.title}
      </Link>
    );
  }
  if (entry.kind === "log") {
    return (
      <Link
        href={href}
        className={`${base} bg-accent-600 font-medium text-white hover:bg-accent-700`}
        title={entry.title}
        data-kind="log"
      >
        {entry.visibility === "private" ? "🔒 " : "✓ "}
        {entry.title}
      </Link>
    );
  }
  const content = (
    <>
      {entry.visibility === "private" ? "🔒 " : ""}
      {entry.title}: <strong>{entry.value}</strong>
    </>
  );
  return href === "#" ? (
    <span className={`${base} bg-sky-100 text-sky-900`} title={`${entry.title}: ${entry.value}`} data-kind="test">
      {content}
    </span>
  ) : (
    <Link
      href={href}
      className={`${base} bg-sky-100 text-sky-900 hover:bg-sky-200`}
      title={`${entry.title}: ${entry.value}`}
      data-kind="test"
    >
      {content}
    </Link>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-dashed border-stone-400" /> Planned
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-dashed border-sky-400" /> Planned test
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded border border-dashed border-red-300" /> Missed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded bg-accent-600" /> Logged session
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded bg-sky-100" /> Test result
      </span>
    </div>
  );
}
