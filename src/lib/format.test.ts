import { describe, expect, it } from "vitest";
import { formatDuration, formatPrescription, formatTestValue, percentBodyweight } from "@/lib/format";

describe("formatPrescription", () => {
  it("formats a max hang prescription", () => {
    expect(formatPrescription({ sets: 5, reps: 1, duration_sec: 10, rest_sec: 180, edge_mm: 20, load_kg: 15 })).toBe(
      "5 × 1 · 10 s · 20 mm · +15 kg · rest 3 min",
    );
  });

  it("formats assisted load, grades and partial prescriptions", () => {
    expect(formatPrescription({ load_kg: -10, grade: "7A" })).toBe("−10 kg · 7A");
    expect(formatPrescription({ sets: 1 })).toBe("1 set");
    expect(formatPrescription({ reps: 15 })).toBe("15 reps");
    expect(formatPrescription({})).toBe("");
  });
});

describe("formatDuration", () => {
  it.each([
    [45, "45 s"],
    [90, "1 min 30 s"],
    [180, "3 min"],
    [3600, "1 h"],
    [5400, "1 h 30 min"],
  ])("%i -> %s", (seconds, expected) => expect(formatDuration(seconds)).toBe(expected));
});

describe("formatTestValue", () => {
  it("formats each unit", () => {
    expect(formatTestValue("kg_added", 17.5)).toBe("+17.5 kg");
    expect(formatTestValue("kg_added", 0)).toBe("bodyweight");
    expect(formatTestValue("mm", 12)).toBe("12 mm");
    expect(formatTestValue("reps", 16)).toBe("16 reps");
    expect(formatTestValue("seconds", 8)).toBe("8 s");
    expect(formatTestValue("font_grade", 11)).toBe("7A");
    expect(formatTestValue("french_grade", 12)).toBe("7a");
  });
});

describe("percentBodyweight", () => {
  it("computes total load relative to bodyweight", () => {
    expect(percentBodyweight(17.5, 68)).toBe("126% BW");
    expect(percentBodyweight(-10, 70)).toBe("86% BW");
    expect(percentBodyweight(10, null)).toBeNull();
  });
});
