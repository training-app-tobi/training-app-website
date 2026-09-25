import type { Metadata } from "next";
import { LogForm } from "@/components/log-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { newLogValues } from "@/lib/log-form-data";
import { getLibrary } from "@/lib/queries";

export const metadata: Metadata = { title: "Log session" };

export default async function NewLogPage({ searchParams }: PageProps<"/logs/new">) {
  const { supabase, userId } = await requireUser();
  const { session, date } = await searchParams;
  const [{ values, plannedLabel }, library] = await Promise.all([
    newLogValues(supabase, userId, {
      sessionId: typeof session === "string" ? session : undefined,
      date: typeof date === "string" ? date : undefined,
    }),
    getLibrary(supabase, userId),
  ]);

  return (
    <>
      <PageHeader title="Log a session" />
      <LogForm logId={null} initial={values} exercises={library.exercises} plannedLabel={plannedLabel} />
    </>
  );
}
