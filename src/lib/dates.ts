import { addDays, format, isValid, parse, startOfISOWeek } from "date-fns";

export const ISO_DATE = "yyyy-MM-dd";
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** Parse a YYYY-MM-DD string as a local calendar date (no timezone shifts). */
export function parseISODate(value: string): Date {
  return parse(value, ISO_DATE, new Date(2000, 0, 1));
}

export function toISODate(date: Date): string {
  return format(date, ISO_DATE);
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISODate(value)) && toISODate(parseISODate(value)) === value;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(value: string, days: number): string {
  return toISODate(addDays(parseISODate(value), days));
}

export function mondayOf(value: string): string {
  return toISODate(startOfISOWeek(parseISODate(value)));
}

/** The next `count` Mondays starting with this week's Monday. */
export function upcomingMondays(fromISO: string, count: number): string[] {
  const first = mondayOf(fromISO);
  return Array.from({ length: count }, (_, i) => addDaysISO(first, i * 7));
}

export function formatDate(value: string, pattern = "EEE d MMM yyyy"): string {
  return format(parseISODate(value), pattern);
}

export function weekdayName(weekday: number, long = false): string {
  return (long ? WEEKDAYS_LONG : WEEKDAYS)[weekday - 1] ?? "?";
}
