import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, UserLink } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Public plans" };

export default async function ExplorePlansPage({ searchParams }: PageProps<"/plans/explore">) {
  const { supabase } = await requireUser();
  const { q } = await searchParams;
  // Keep only characters that are safe inside a PostgREST filter expression.
  const search =
    typeof q === "string"
      ? q
          .replace(/[^\p{L}\p{N} _-]/gu, "")
          .trim()
          .slice(0, 60)
      : "";

  let query = supabase
    .from("plans")
    .select("id, title, goal, created_at, owner:profiles(username, display_name), plan_weeks(count)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(60);
  if (search) query = query.or(`title.ilike.%${search}%,goal.ilike.%${search}%`);
  const { data: plans } = await query;

  return (
    <>
      <PageHeader
        title="Public plans"
        description="Plans shared by the community. Copy one into your account to schedule and adapt it."
        actions={
          <Link href="/plans" className="btn-secondary">
            My plans
          </Link>
        }
      />
      <form className="mb-6 flex max-w-md gap-2" role="search">
        <input
          className="input"
          name="q"
          defaultValue={search}
          placeholder="Search by title or goal"
          aria-label="Search plans"
        />
        <button className="btn-secondary" type="submit">
          Search
        </button>
      </form>
      {(plans ?? []).length === 0 ? (
        <EmptyState>No public plans found.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans!.map((plan) => (
            <div key={plan.id} className="card">
              <Link href={`/plans/${plan.id}`} className="font-semibold hover:underline">
                {plan.title}
              </Link>
              {plan.goal && <p className="mt-1 text-sm text-stone-600">Goal: {plan.goal}</p>}
              <p className="mt-2 text-xs text-stone-500">
                By <UserLink profile={plan.owner} /> · {plan.plan_weeks[0]?.count ?? 0} weeks ·{" "}
                {formatDate(plan.created_at.slice(0, 10))}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
