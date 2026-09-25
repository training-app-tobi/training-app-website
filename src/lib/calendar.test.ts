import { describe, expect, it } from "vitest";
import { buildMonthGrid, isMonthKey, monthRange } from "@/lib/calendar";

describe("monthRange", () => {
  it("starts on the Monday before the 1st and ends on the Sunday after the last day", () => {
    // September 2026: 1st is a Tuesday, 30th is a Wednesday.
    expect(monthRange("2026-09")).toEqual({ start: "2026-08-31", end: "2026-10-04" });
  });

  it("does not pad when the month starts on a Monday", () => {
    // June 2026 starts on a Monday and ends on a Tuesday.
    expect(monthRange("2026-06")).toEqual({ start: "2026-06-01", end: "2026-07-05" });
  });
});

describe("buildMonthGrid", () => {
  const items = [
    { date: "2026-09-01", id: "a" },
    { date: "2026-09-01", id: "b" },
    { date: "2026-10-03", id: "c" }, // visible trailing day
    { date: "2026-12-25", id: "d" }, // outside the grid
  ];
  const grid = buildMonthGrid("2026-09", items, "2026-09-25");

  it("produces full Monday-first weeks", () => {
    expect(grid.weeks).toHaveLength(5);
    for (const week of grid.weeks) expect(week).toHaveLength(7);
    expect(grid.weeks[0][0].date).toBe("2026-08-31");
    expect(grid.weeks[4][6].date).toBe("2026-10-04");
  });

  it("places items on their dates and ignores out-of-range items", () => {
    const days = grid.weeks.flat();
    expect(days.find((d) => d.date === "2026-09-01")?.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(days.find((d) => d.date === "2026-10-03")?.items.map((i) => i.id)).toEqual(["c"]);
    expect(days.flatMap((d) => d.items).map((i) => i.id)).not.toContain("d");
  });

  it("marks in-month days and today", () => {
    const days = grid.weeks.flat();
    expect(days.find((d) => d.date === "2026-08-31")?.inMonth).toBe(false);
    expect(days.find((d) => d.date === "2026-09-30")?.inMonth).toBe(true);
    expect(days.filter((d) => d.isToday).map((d) => d.date)).toEqual(["2026-09-25"]);
  });

  it("links to the neighbouring months across year boundaries", () => {
    const jan = buildMonthGrid("2027-01", [], "2027-01-01");
    expect(jan.prevMonth).toBe("2026-12");
    expect(jan.nextMonth).toBe("2027-02");
    expect(jan.label).toBe("January 2027");
  });
});

describe("isMonthKey", () => {
  it.each([
    ["2026-09", true],
    ["2026-13", false],
    ["2026-9", false],
    ["", false],
    [undefined, false],
  ])("%s -> %s", (value, expected) => expect(isMonthKey(value)).toBe(expected));
});
