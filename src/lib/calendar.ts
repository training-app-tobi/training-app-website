import { addMonths, endOfMonth, endOfISOWeek, format, startOfISOWeek, startOfMonth } from "date-fns";
import { addDaysISO, parseISODate, toISODate } from "@/lib/dates";

export type CalendarDay<T> = {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  items: T[];
};

export type MonthGrid<T> = {
  month: string; // YYYY-MM
  label: string; // e.g. "September 2026"
  start: string; // first visible day (a Monday)
  end: string; // last visible day (a Sunday)
  prevMonth: string;
  nextMonth: string;
  weeks: CalendarDay<T>[][];
};

export function isMonthKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

/** Visible date range (Mon–Sun weeks) for a month, for querying before building the grid. */
export function monthRange(month: string): { start: string; end: string } {
  const first = parseISODate(`${month}-01`);
  return {
    start: toISODate(startOfISOWeek(startOfMonth(first))),
    end: toISODate(endOfISOWeek(endOfMonth(first))),
  };
}

/**
 * Builds a Monday-first month grid and places each item on its date.
 * Items outside the visible range are ignored.
 */
export function buildMonthGrid<T extends { date: string }>(month: string, items: T[], today: string): MonthGrid<T> {
  const first = parseISODate(`${month}-01`);
  const { start, end } = monthRange(month);

  const byDate = new Map<string, T[]>();
  for (const item of items) {
    const list = byDate.get(item.date);
    if (list) list.push(item);
    else byDate.set(item.date, [item]);
  }

  const weeks: CalendarDay<T>[][] = [];
  for (let date = start; date <= end; date = addDaysISO(date, 1)) {
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) weeks.push([]);
    weeks[weeks.length - 1].push({
      date,
      inMonth: date.startsWith(month),
      isToday: date === today,
      items: byDate.get(date) ?? [],
    });
  }

  return {
    month,
    label: format(first, "MMMM yyyy"),
    start,
    end,
    prevMonth: monthKey(addMonths(first, -1)),
    nextMonth: monthKey(addMonths(first, 1)),
    weeks,
  };
}
