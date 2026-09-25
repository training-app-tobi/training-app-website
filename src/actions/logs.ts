"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { firstError, logSchema, type LogInput } from "@/lib/validation";

const logId = z.guid();

/** Creates a log (logId null) or replaces an existing one's fields and exercises. */
export async function saveLog(id: string | null, input: LogInput): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  if (id !== null && !logId.safeParse(id).success) return { error: "Invalid log." };
  const parsed = logSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { exercises, ...fields } = parsed.data;

  let savedId: string;
  if (id) {
    const { data, error } = await supabase.from("session_logs").update(fields).eq("id", id).select("id").single();
    if (error) return { error: dbErrorMessage(error) };
    savedId = data.id;
    const { error: deleteError } = await supabase.from("logged_exercises").delete().eq("log_id", savedId);
    if (deleteError) return { error: dbErrorMessage(deleteError) };
  } else {
    const { data, error } = await supabase.from("session_logs").insert(fields).select("id").single();
    if (error) return { error: dbErrorMessage(error) };
    savedId = data.id;
  }

  if (exercises.length > 0) {
    const { error } = await supabase
      .from("logged_exercises")
      .insert(exercises.map((e, position) => ({ ...e, log_id: savedId, position })));
    if (error) {
      if (!id) await supabase.from("session_logs").delete().eq("id", savedId);
      return { error: dbErrorMessage(error) };
    }
  }

  revalidatePath("/logs");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect(`/logs/${savedId}`);
}

export async function deleteLog(id: string) {
  const { supabase } = await requireUser();
  if (!logId.safeParse(id).success) return;
  const { error } = await supabase.from("session_logs").delete().eq("id", id);
  if (error) throw new Error(dbErrorMessage(error));
  revalidatePath("/logs");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  redirect("/logs");
}
