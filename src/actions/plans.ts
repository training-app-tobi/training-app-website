"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import type { Json } from "@/lib/database.types";
import { dbErrorMessage } from "@/lib/errors";
import { firstError, newPlanSchema, planSchema, type PlanInput } from "@/lib/validation";

const planId = z.guid();

export async function createPlan(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const values = {
    title: String(formData.get("title") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    description: String(formData.get("description") ?? ""),
    visibility: String(formData.get("visibility") ?? "public"),
  };
  const parsed = newPlanSchema.safeParse(values);
  if (!parsed.success) return { error: firstError(parsed.error), values };

  const { data, error } = await supabase.from("plans").insert(parsed.data).select("id").single();
  if (error) return { error: dbErrorMessage(error), values };

  redirect(`/plans/${data.id}/edit`);
}

/** Saves the whole plan tree atomically via the save_plan database function. */
export async function savePlan(id: string, input: PlanInput): Promise<{ error?: string; ok?: boolean }> {
  const { supabase } = await requireUser();
  if (!planId.safeParse(id).success) return { error: "Invalid plan." };
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase.rpc("save_plan", {
    p_plan_id: id,
    p_plan: parsed.data as unknown as Json,
  });
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath(`/plans/${id}`);
  revalidatePath("/plans");
  return { ok: true };
}

export async function deletePlan(id: string) {
  const { supabase } = await requireUser();
  if (!planId.safeParse(id).success) return;
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/plans");
  revalidatePath("/calendar");
  redirect("/plans");
}

/** Copy someone's (or your own) plan into your account, then pick a start date. */
export async function copyPlan(id: string) {
  const { supabase } = await requireUser();
  if (!planId.safeParse(id).success) return;
  const { data, error } = await supabase.rpc("copy_plan", { p_plan_id: id });
  if (error || !data) throw new Error(dbErrorMessage(error));
  revalidatePath("/plans");
  redirect(`/plans/${data}/schedule?copied=1`);
}
