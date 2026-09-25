import type { Metadata } from "next";
import { TestForm, type TestFormInitial } from "@/components/test-form";
import { PageHeader } from "@/components/ui";
import { getMyProfile, requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { getLibrary } from "@/lib/queries";

export const metadata: Metadata = { title: "Log test" };

export default async function NewTestPage({ searchParams }: PageProps<"/tests/new">) {
  const { supabase, userId } = await requireUser();
  const { session } = await searchParams;
  const [profile, library] = await Promise.all([getMyProfile(), getLibrary(supabase, userId)]);

  const initial: TestFormInitial = {
    date: todayISO(),
    bodyweight_kg: profile?.bodyweight_kg ? String(profile.bodyweight_kg) : "",
    scheduled_session_id: null,
    test_type_ids: [],
  };
  let plannedLabel: string | undefined;

  if (typeof session === "string") {
    const { data } = await supabase
      .from("scheduled_sessions")
      .select("id, date, plan_days(title, plans(title), plan_day_items(position, test_type_id))")
      .eq("id", session)
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.plan_days) {
      initial.date = data.date;
      initial.scheduled_session_id = data.id;
      initial.test_type_ids = [...data.plan_days.plan_day_items]
        .sort((a, b) => a.position - b.position)
        .map((i) => i.test_type_id)
        .filter((id): id is string => !!id && library.tests.some((t) => t.id === id));
      plannedLabel = `${data.plan_days.title} (${data.plan_days.plans?.title ?? "plan"})`;
    }
  }

  return (
    <>
      <PageHeader title="Log test results" description="Record one or more tests from the same day." />
      <TestForm tests={library.tests} initial={initial} plannedLabel={plannedLabel} />
    </>
  );
}
