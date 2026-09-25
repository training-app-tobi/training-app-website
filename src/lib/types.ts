import type { Database } from "@/lib/database.types";

type Enums = Database["public"]["Enums"];
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export type Visibility = Enums["visibility"];
export type ExerciseCategory = Enums["exercise_category"];
export type TestCategory = Enums["test_category"];
export type TestUnit = Enums["test_unit"];
export type DayKind = Enums["day_kind"];

export const VISIBILITIES: Visibility[] = ["public", "private"];

export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "finger_strength", label: "Finger strength" },
  { value: "strength", label: "Strength" },
  { value: "power", label: "Power" },
  { value: "power_endurance", label: "Power endurance" },
  { value: "endurance", label: "Endurance" },
  { value: "climbing", label: "Climbing" },
  { value: "antagonist", label: "Antagonist" },
  { value: "mobility", label: "Mobility" },
  { value: "other", label: "Other" },
];

export const TEST_CATEGORIES: { value: TestCategory; label: string }[] = [
  { value: "finger", label: "Finger strength" },
  { value: "pulling", label: "Pulling strength" },
  { value: "grade", label: "Grade benchmark" },
  { value: "other", label: "Other" },
];

export const TEST_UNITS: { value: TestUnit; label: string }[] = [
  { value: "kg_added", label: "Added weight (kg)" },
  { value: "mm", label: "Edge depth (mm)" },
  { value: "reps", label: "Repetitions" },
  { value: "seconds", label: "Seconds" },
  { value: "font_grade", label: "Boulder grade (Font)" },
  { value: "french_grade", label: "Route grade (French)" },
];

export function exerciseCategoryLabel(value: string): string {
  return EXERCISE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function testCategoryLabel(value: string): string {
  return TEST_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function testUnitLabel(value: string): string {
  return TEST_UNITS.find((c) => c.value === value)?.label ?? value;
}
