import "server-only";
import type { TestResultRow } from "@/components/test-history";
import type { SupabaseServerClient } from "@/lib/supabase/server";

export async function getTestRows(supabase: SupabaseServerClient, userId: string): Promise<TestResultRow[]> {
  const { data } = await supabase
    .from("test_results")
    .select("id, date, value, bodyweight_kg, notes, visibility, test_types(id, name, unit, higher_is_better, category)")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .limit(1000);
  return (data ?? []).map((r) => ({
    ...r,
    value: Number(r.value),
    bodyweight_kg: r.bodyweight_kg === null ? null : Number(r.bodyweight_kg),
  }));
}
