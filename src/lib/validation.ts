import { z } from "zod";
import { isISODate, parseISODate } from "@/lib/dates";

// Limits mirror the database CHECK constraints so users get friendly errors first.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Accepts numbers or numeric strings; empty/null/undefined become null. */
const optionalNumber = (min: number, max: number, opts: { int?: boolean } = {}) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : typeof v === "string" ? Number(v) : v),
    (opts.int ? z.number().int("Must be a whole number") : z.number())
      .min(min, `Must be at least ${min}`)
      .max(max, `Must be at most ${max}`)
      .nullable(),
  );

const isoDate = z.string().refine(isISODate, "Enter a valid date");
const id = z.guid();

export const visibilitySchema = z.enum(["public", "private"]);
export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,24}$/, "3–24 letters, numbers or underscores");

// Supabase Auth (bcrypt) only uses the first 72 bytes of a password.
const password = z.string().min(10, "Use at least 10 characters").max(72, "Use at most 72 characters");

export const signUpSchema = z.object({
  email: z.email("Enter a valid email").max(254),
  password,
  username: usernameSchema,
  display_name: optionalText(60),
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(72),
});

export const emailSchema = z.object({ email: z.email("Enter a valid email") });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] });

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: optionalText(60),
  bodyweight_kg: optionalNumber(20, 250),
});

const prescription = {
  sets: optionalNumber(1, 100, { int: true }),
  reps: optionalNumber(1, 1000, { int: true }),
  duration_sec: optionalNumber(1, 86400, { int: true }),
  load_kg: optionalNumber(-200, 500),
  edge_mm: optionalNumber(3, 100),
  grade: optionalText(10),
  notes: optionalText(1000),
};

export const planItemSchema = z
  .object({
    id,
    exercise_id: id
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    test_type_id: id
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    ...prescription,
    rest_sec: optionalNumber(0, 86400, { int: true }),
  })
  .refine((v) => (v.exercise_id === null) !== (v.test_type_id === null), {
    message: "Pick an exercise or a test for every item",
  });

export const planDaySchema = z.object({
  id,
  weekday: z.number().int().min(1).max(7),
  kind: z.enum(["training", "test"]),
  title: z.string().trim().min(1, "Every day needs a title").max(80),
  notes: optionalText(2000),
  items: z.array(planItemSchema).max(30, "At most 30 items per day"),
});

export const planWeekSchema = z
  .object({ id, days: z.array(planDaySchema).max(7) })
  .refine((w) => new Set(w.days.map((d) => d.weekday)).size === w.days.length, {
    message: "A week can only have one session per weekday",
  });

export const planBlockSchema = z.object({
  id,
  name: z.string().trim().min(1, "Every block needs a name").max(80),
  focus: optionalText(300),
  weeks: z.array(planWeekSchema).min(1, "Every block needs at least one week").max(52),
});

export const planSchema = z
  .object({
    title: z.string().trim().min(1, "Give the plan a title").max(120),
    description: optionalText(5000),
    goal: optionalText(300),
    visibility: visibilitySchema,
    blocks: z.array(planBlockSchema).max(52),
  })
  .refine((p) => p.blocks.reduce((n, b) => n + b.weeks.length, 0) <= 52, {
    message: "A plan can be at most 52 weeks long",
  });

export type PlanInput = z.input<typeof planSchema>;

export const newPlanSchema = z.object({
  title: z.string().trim().min(1, "Give the plan a title").max(120),
  goal: optionalText(300),
  description: optionalText(5000),
  visibility: visibilitySchema,
});

export const scheduleSchema = z.object({
  plan_id: id,
  start_date: isoDate.refine((v) => parseISODate(v).getDay() === 1, "Plans start on a Monday"),
});

export const loggedExerciseSchema = z.object({
  exercise_id: id,
  ...prescription,
  completed: z.boolean(),
});

export const logSchema = z.object({
  date: isoDate,
  title: z.string().trim().min(1, "Give the session a title").max(120),
  scheduled_session_id: id.nullable(),
  duration_min: optionalNumber(1, 1440, { int: true }),
  rpe: optionalNumber(1, 10, { int: true }),
  notes: optionalText(5000),
  visibility: visibilitySchema,
  exercises: z.array(loggedExerciseSchema).max(50),
});

export type LogInput = z.input<typeof logSchema>;

export const testResultsSchema = z.object({
  date: isoDate,
  bodyweight_kg: optionalNumber(20, 250),
  notes: optionalText(2000),
  visibility: visibilitySchema,
  scheduled_session_id: id.nullable(),
  results: z
    .array(z.object({ test_type_id: id, value: z.number().min(-200).max(100000) }))
    .min(1, "Add at least one result")
    .max(20),
});

export type TestResultsInput = z.input<typeof testResultsSchema>;

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.enum([
    "finger_strength",
    "strength",
    "power",
    "power_endurance",
    "endurance",
    "climbing",
    "antagonist",
    "mobility",
    "other",
  ]),
  description: optionalText(2000),
});

export const testTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  category: z.enum(["finger", "pulling", "grade", "other"]),
  unit: z.enum(["kg_added", "mm", "reps", "seconds", "font_grade", "french_grade"]),
  higher_is_better: z.boolean(),
  protocol: optionalText(2000),
});

/** First human-readable message from a failed parse. */
export function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Invalid input";
}
