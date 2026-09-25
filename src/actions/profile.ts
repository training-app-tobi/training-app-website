"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { firstError, profileSchema } from "@/lib/validation";

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireUser();
  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    display_name: formData.get("display_name"),
    bodyweight_kg: formData.get("bodyweight_kg"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error?.code === "23505") return { error: "That username is taken." };
  if (error) return { error: dbErrorMessage(error) };

  revalidatePath("/", "layout");
  return { ok: "Profile saved." };
}
