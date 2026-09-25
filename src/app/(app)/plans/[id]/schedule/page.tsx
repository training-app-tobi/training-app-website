import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScheduleForm } from "@/components/plan-forms";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { todayISO, upcomingMondays } from "@/lib/dates";
import { getPlanTree } from "@/lib/queries";

export const metadata: Metadata = { title: "Schedule plan" };

export default async function SchedulePlanPage({ params, searchParams }: PageProps<"/plans/[id]/schedule">) {
  const { id } = await params;
  const { copied } = await searchParams;
  const { supabase, userId } = await requireUser();
  const plan = await getPlanTree(supabase, id);
  if (!plan) notFound();
  // Only your own plans can be scheduled; others' plans are copied first.
  if (plan.owner_id !== userId) redirect(`/plans/${id}`);

  const sessionCount = plan.blocks.reduce((n, b) => n + b.weeks.reduce((m, w) => m + w.days.length, 0), 0);

  return (
    <>
      <PageHeader title={`Schedule “${plan.title}”`} />
      {copied && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          Copied to your plans. Pick a start date, or{" "}
          <Link href={`/plans/${id}/edit`} className="link">
            edit it first
          </Link>
          .
        </p>
      )}
      <div className="card max-w-xl">
        <p className="mb-4 text-sm text-stone-600">
          {plan.totalWeeks} weeks, {sessionCount} sessions across {plan.blocks.length} blocks. Each week starts on a
          Monday; sessions land on the weekdays set in the plan.
        </p>
        {sessionCount === 0 ? (
          <p className="text-sm">
            This plan has no sessions yet.{" "}
            <Link href={`/plans/${id}/edit`} className="link">
              Add some
            </Link>{" "}
            first.
          </p>
        ) : (
          <ScheduleForm planId={id} mondays={upcomingMondays(todayISO(), 12)} />
        )}
      </div>
    </>
  );
}
