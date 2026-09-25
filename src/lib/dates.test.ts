import { describe, expect, it } from "vitest";
import { addDaysISO, isISODate, mondayOf, upcomingMondays, weekdayName } from "@/lib/dates";

describe("dates", () => {
  it("validates ISO dates strictly", () => {
    expect(isISODate("2026-09-25")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-9-25")).toBe(false);
    expect(isISODate("not a date")).toBe(false);
  });

  it("finds the Monday of a week", () => {
    expect(mondayOf("2026-09-25")).toBe("2026-09-21"); // Friday
    expect(mondayOf("2026-09-21")).toBe("2026-09-21"); // Monday
    expect(mondayOf("2026-09-27")).toBe("2026-09-21"); // Sunday
  });

  it("lists upcoming Mondays", () => {
    expect(upcomingMondays("2026-09-25", 3)).toEqual(["2026-09-21", "2026-09-28", "2026-10-05"]);
  });

  it("adds days across month and DST boundaries", () => {
    expect(addDaysISO("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDaysISO("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("names ISO weekdays", () => {
    expect(weekdayName(1)).toBe("Mon");
    expect(weekdayName(7, true)).toBe("Sunday");
  });
});
