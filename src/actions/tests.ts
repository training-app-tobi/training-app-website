"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { FONT_GRADES, FRENCH_GRADES } from "@/lib/grades";
import type { TestUnit } from "@/lib/types";
import { firstError, testResultsSchema, type TestResultsInput } from "@/lib/validation";

function valueError(unit: TestUnit, value: number): string | null {
  switch (unit) {
    case "font_grade":
      return Number.isInteger(value) && value >= 0 && value < FONT_GRADES.length ? null : "Pick a grade";
    case "french_grade":
      return Number.isInteger(value) && value >= 0 && value < FRENCH_GRADES.length ? null : "Pick a grade";
    case "mm":
      return value >= 3 && value <= 100 ? null : "Edge depth must be 3–100 mm";
    case "reps":
    case "seconds":
      return value >= 0 && value <= 100000 ? null : "Must be zero or more";
    case "kg_added":
      return value >= -200 && value <= 500 ? null : "Added weight must be between -200 and 500 kg";
  }
}

export async function saveTestResults(input: TestResultsInput): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const parsed = testResultsSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { results, ...shared } = parsed.data;

  const ids = [...new Set(results.map((r) => r.test_type_id))];
  const { data: types, error: typesError } = await supabase.from("test_types").select("id, name, unit").in("id", ids);
  if (typesError) return { error: dbErrorMessage(typesError) };
  for (const r of results) {
    const type = types.find((t) => t.id === r.test_type_id);
    if (!type) return { error: "Unknown test." };
    const problem = valueError(type.unit, r.value);
    if (problem) return { error: `${type.name}: ${problem}` };
  }

  const { error } = await supabase.from("test_results").insert(results.map((r) => ({ ...shared, ...r })));
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/tests");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect("/tests");
}

export async function deleteTestResult(id: string) {
  const { supabase } = await requireUser();
  if (!z.guid().safeParse(id).success) return;
  const { error } = await supabase.from("test_results").delete().eq("id", id);
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/tests");
  revalidatePath("/calendar");
}
