import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copyPlan, deletePlan } from "@/actions/plans";
import { ConfirmButton, SubmitButton } from "@/components/form-controls";
import { PlanView } from "@/components/plan-view";
import { PageHeader, UserLink, VisibilityBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPlanTree } from "@/lib/queries";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage({ params }: PageProps<"/plans/[id]">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const plan = await getPlanTree(supabase, id);
  if (!plan) notFound();

  const isOwner = plan.owner_id === userId;
  const [{ data: source }, { count: copies }] = await Promise.all([
    plan.source_plan_id
      ? supabase
          .from("plans")
          .select("id, title, owner:profiles(username, display_name)")
          .eq("id", plan.source_plan_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("source_plan_id", plan.id),
  ]);
  const sessionCount = plan.blocks.reduce((n, b) => n + b.weeks.reduce((m, w) => m + w.days.length, 0), 0);

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {plan.title} <VisibilityBadge visibility={plan.visibility} />
          </span>
        }
        description={
          <span className="space-y-1">
            <span className="block">
              By <UserLink profile={plan.owner} /> · {plan.totalWeeks} weeks · {sessionCount} sessions
              {copies ? ` · copied ${copies} ${copies === 1 ? "time" : "times"}` : ""}
            </span>
            {source && (
              <span className="block">
                Copied from{" "}
                <Link href={`/plans/${source.id}`} className="link">
                  {source.title}
                </Link>
                {source.owner && (
                  <>
                    {" "}
                    by <UserLink profile={source.owner} />
                  </>
                )}
              </span>
            )}
          </span>
        }
        actions={
          isOwner ? (
            <>
              <Link href={`/plans/${plan.id}/edit`} className="btn-secondary">
                Edit
              </Link>
              <Link href={`/plans/${plan.id}/schedule`} className="btn-primary">
                Schedule
              </Link>
              <ConfirmButton
                action={deletePlan.bind(null, plan.id)}
                confirm="Delete this plan and its scheduled sessions? Your logs are kept."
              >
                Delete
              </ConfirmButton>
            </>
          ) : (
            <form action={copyPlan.bind(null, plan.id)}>
              <SubmitButton pendingText="Copying…">Copy &amp; schedule</SubmitButton>
            </form>
          )
        }
      />

      {(plan.goal || plan.description) && (
        <div className="card mb-6 space-y-2">
          {plan.goal && (
            <p>
              <span className="font-semibold">Goal:</span> {plan.goal}
            </p>
          )}
          {plan.description && <p className="text-sm whitespace-pre-line text-stone-700">{plan.description}</p>}
        </div>
      )}

      <PlanView plan={plan} />
    </>
  );
}
