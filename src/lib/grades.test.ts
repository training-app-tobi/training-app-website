import { describe, expect, it } from "vitest";
import { FONT_GRADES, FRENCH_GRADES, gradeIndex, gradeLabel, isKnownGrade } from "@/lib/grades";

describe("grades", () => {
  it("round-trips labels and indices", () => {
    for (const [i, label] of FONT_GRADES.entries()) expect(gradeIndex("font", label)).toBe(i);
    for (const [i, label] of FRENCH_GRADES.entries()) expect(gradeIndex("french", label)).toBe(i);
    expect(gradeLabel("font", gradeIndex("font", "7A"))).toBe("7A");
    expect(gradeLabel("french", gradeIndex("french", "7a"))).toBe("7a");
  });

  it("orders grades from easy to hard", () => {
    expect(gradeIndex("font", "6C+")).toBeLessThan(gradeIndex("font", "7A"));
    expect(gradeIndex("french", "6c+")).toBeLessThan(gradeIndex("french", "7a"));
  });

  it("matches the indices used in the seed data", () => {
    expect(gradeIndex("font", "6C+")).toBe(10);
    expect(gradeIndex("french", "7a")).toBe(12);
  });

  it("handles unknown values", () => {
    expect(gradeLabel("font", 99)).toBe("?");
    expect(gradeLabel("font", 1.5)).toBe("?");
    expect(gradeIndex("french", "7A")).toBe(-1);
    expect(isKnownGrade("7A")).toBe(true);
    expect(isKnownGrade("7a+")).toBe(true);
    expect(isKnownGrade("V5")).toBe(false);
  });
});
