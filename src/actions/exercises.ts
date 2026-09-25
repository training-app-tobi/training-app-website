"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { exerciseSchema, firstError, testTypeSchema } from "@/lib/validation";

export async function createExercise(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsed = exerciseSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase.from("exercises").insert(parsed.data);
  if (error) return { error: dbErrorMessage(error) };
  revalidatePath("/exercises");
  return { ok: `Added “${parsed.data.name}”.` };
}

export async function createTestType(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsed = testTypeSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    higher_is_better: formData.get("higher_is_better") !== "false",
    protocol: formData.get("protocol"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase.from("test_types").insert(parsed.data);
  if (error) return { error: dbErrorMessage(error) };
  revalidatePath("/exercises");
  return { ok: `Added test “${parsed.data.name}”.` };
}

/** Custom definitions are archived, not deleted, so plans and logs using them keep working. */
export async function archiveExercise(id: string) {
  const { supabase } = await requireUser();
  if (!z.guid().safeParse(id).success) return;
  const { error } = await supabase.from("exercises").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/exercises");
}

export async function archiveTestType(id: string) {
  const { supabase } = await requireUser();
  if (!z.guid().safeParse(id).success) return;
  const { error } = await supabase.from("test_types").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/exercises");
}
