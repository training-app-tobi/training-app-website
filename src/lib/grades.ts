// Grades are stored as an index into these ordered lists (easier to compare and chart).

export const FONT_GRADES = [
  "3",
  "4",
  "4+",
  "5",
  "5+",
  "6A",
  "6A+",
  "6B",
  "6B+",
  "6C",
  "6C+",
  "7A",
  "7A+",
  "7B",
  "7B+",
  "7C",
  "7C+",
  "8A",
  "8A+",
  "8B",
  "8B+",
  "8C",
  "8C+",
  "9A",
] as const;

export const FRENCH_GRADES = [
  "4a",
  "4b",
  "4c",
  "5a",
  "5b",
  "5c",
  "6a",
  "6a+",
  "6b",
  "6b+",
  "6c",
  "6c+",
  "7a",
  "7a+",
  "7b",
  "7b+",
  "7c",
  "7c+",
  "8a",
  "8a+",
  "8b",
  "8b+",
  "8c",
  "8c+",
  "9a",
  "9a+",
  "9b",
  "9b+",
  "9c",
] as const;

export type GradeScale = "font" | "french";

export function gradeList(scale: GradeScale): readonly string[] {
  return scale === "font" ? FONT_GRADES : FRENCH_GRADES;
}

export function gradeLabel(scale: GradeScale, index: number): string {
  const list = gradeList(scale);
  return Number.isInteger(index) && index >= 0 && index < list.length ? list[index] : "?";
}

export function gradeIndex(scale: GradeScale, label: string): number {
  return gradeList(scale).indexOf(label);
}

/** Free-text grade fields (plan items, logged exercises) accept either scale. */
export function isKnownGrade(label: string): boolean {
  return gradeIndex("font", label) >= 0 || gradeIndex("french", label) >= 0;
}
