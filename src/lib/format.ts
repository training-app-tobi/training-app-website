import { gradeLabel } from "@/lib/grades";
import type { TestUnit } from "@/lib/types";

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m} min ${s} s` : `${m} min`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function formatLoad(kg: number): string {
  if (kg === 0) return "bodyweight";
  return `${kg > 0 ? "+" : "−"}${formatNumber(Math.abs(kg))} kg`;
}

export type Prescription = {
  sets?: number | null;
  reps?: number | null;
  duration_sec?: number | null;
  rest_sec?: number | null;
  load_kg?: number | null;
  edge_mm?: number | null;
  grade?: string | null;
};

/** "5 × 1 · 10 s · 20 mm · +15 kg · 6C+ · rest 3 min" */
export function formatPrescription(p: Prescription): string {
  const parts: string[] = [];
  if (p.sets && p.reps) parts.push(`${p.sets} × ${p.reps}`);
  else if (p.sets) parts.push(`${p.sets} ${p.sets === 1 ? "set" : "sets"}`);
  else if (p.reps) parts.push(`${p.reps} reps`);
  if (p.duration_sec) parts.push(formatDuration(p.duration_sec));
  if (p.edge_mm != null) parts.push(`${formatNumber(Number(p.edge_mm))} mm`);
  if (p.load_kg != null) parts.push(formatLoad(Number(p.load_kg)));
  if (p.grade) parts.push(p.grade);
  if (p.rest_sec) parts.push(`rest ${formatDuration(p.rest_sec)}`);
  return parts.join(" · ");
}

export function formatTestValue(unit: TestUnit, value: number): string {
  switch (unit) {
    case "kg_added":
      return formatLoad(value);
    case "mm":
      return `${formatNumber(value)} mm`;
    case "reps":
      return `${formatNumber(value)} reps`;
    case "seconds":
      return `${formatNumber(value)} s`;
    case "font_grade":
      return gradeLabel("font", value);
    case "french_grade":
      return gradeLabel("french", value);
  }
}

/** Strength relative to bodyweight, e.g. 126% for +17.5 kg at 68 kg. */
export function percentBodyweight(addedKg: number, bodyweightKg: number | null | undefined): string | null {
  if (!bodyweightKg) return null;
  return `${Math.round(((bodyweightKg + addedKg) / bodyweightKg) * 100)}% BW`;
}

export function displayName(profile: { username: string; display_name: string | null } | null | undefined) {
  if (!profile) return "Unknown climber";
  return profile.display_name || `@${profile.username}`;
}
