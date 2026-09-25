"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { firstError, scheduleSchema } from "@/lib/validation";

export async function schedulePlan(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsed = scheduleSchema.safeParse({
    plan_id: formData.get("plan_id"),
    start_date: formData.get("start_date"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase.rpc("schedule_plan", {
    p_plan_id: parsed.data.plan_id,
    p_start_date: parsed.data.start_date,
  });
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect(`/calendar?month=${parsed.data.start_date.slice(0, 7)}`);
}

export async function unschedule(scheduleId: string) {
  const { supabase } = await requireUser();
  if (!z.guid().safeParse(scheduleId).success) return;
  const { error } = await supabase.rpc("unschedule", { p_schedule_id: scheduleId });
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/plans", "layout");
}
