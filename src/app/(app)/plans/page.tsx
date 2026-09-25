import type { Metadata } from "next";
import Link from "next/link";
import { unschedule } from "@/actions/schedule";
import { ConfirmButton } from "@/components/form-controls";
import { EmptyState, PageHeader, VisibilityBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "My plans" };

export default async function PlansPage() {
  const { supabase, userId } = await requireUser();
  const [{ data: plans }, { data: schedules }] = await Promise.all([
    supabase
      .from("plans")
      .select("id, title, goal, visibility, updated_at, source_plan_id, plan_weeks(count)")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("schedules")
      .select("id, start_date, plan_id, plans(title), scheduled_sessions(date)")
      .eq("user_id", userId)
      .order("start_date", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="My plans"
        description="Build a plan, then schedule it from any Monday to put it on your calendar."
        actions={
          <>
            <Link href="/plans/explore" className="btn-secondary">
              Browse public plans
            </Link>
            <Link href="/plans/new" className="btn-primary">
              New plan
            </Link>
          </>
        }
      />

      {(schedules ?? []).length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-semibold">Scheduled</h2>
          <div className="card divide-y divide-stone-100 p-0 sm:p-0">
            {schedules!.map((s) => {
              const dates = s.scheduled_sessions.map((x) => x.date).sort();
              const end = dates[dates.length - 1];
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/plans/${s.plan_id}`} className="font-medium hover:underline">
                      {s.plans?.title}
                    </Link>
                    <div className="text-xs text-stone-500">
                      {formatDate(s.start_date)}
                      {end ? ` → ${formatDate(end)}` : ""} · {dates.length} sessions
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/calendar?month=${s.start_date.slice(0, 7)}`} className="btn-secondary">
                      View
                    </Link>
                    <ConfirmButton
                      action={unschedule.bind(null, s.id)}
                      confirm="Remove the upcoming sessions of this schedule from your calendar? Logged sessions are kept."
                    >
                      Unschedule
                    </ConfirmButton>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Plans</h2>
        {(plans ?? []).length === 0 ? (
          <EmptyState
            action={
              <Link href="/plans/new" className="btn-primary">
                Create your first plan
              </Link>
            }
          >
            You don&apos;t have any plans yet. Create one or copy a public plan.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans!.map((plan) => (
              <Link key={plan.id} href={`/plans/${plan.id}`} className="card block transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{plan.title}</h3>
                  <VisibilityBadge visibility={plan.visibility} />
                </div>
                {plan.goal && <p className="mt-1 text-sm text-stone-600">Goal: {plan.goal}</p>}
                <p className="mt-2 text-xs text-stone-500">
                  {plan.plan_weeks[0]?.count ?? 0} weeks · updated {formatDate(plan.updated_at.slice(0, 10))}
                  {plan.source_plan_id ? " · copied" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
