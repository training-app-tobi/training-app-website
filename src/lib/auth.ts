import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the verified user id (JWT checked by Supabase Auth via getClaims), or null.
 * Never trust getSession() on the server: its contents come from a cookie.
 */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
});

/** For pages and actions that need a signed-in user. Redirects to /login otherwise. */
export async function requireUser() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const supabase = await createClient();
  return { supabase, userId };
}

export const getMyProfile = cache(async () => {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bodyweight_kg")
    .eq("id", userId)
    .single();
  return data;
});
