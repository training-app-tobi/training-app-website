import type { Metadata } from "next";
import Link from "next/link";
import { Feed, type FeedEntry } from "@/components/feed";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const { supabase, userId } = await requireUser();

  // RLS only returns public rows for other users; we also exclude our own activity here.
  const [logs, tests, plans, climbers] = await Promise.all([
    supabase
      .from("session_logs")
      .select(
        "id, created_at, date, title, duration_min, rpe, author:profiles(username, display_name), logged_exercises(count)",
      )
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("test_results")
      .select("id, created_at, date, value, author:profiles(username, display_name), test_types(name, unit)")
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("plans")
      .select("id, created_at, title, goal, author:profiles(username, display_name)")
      .neq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("profiles")
      .select("username, display_name")
      .neq("id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const entries: FeedEntry[] = [
    ...(logs.data ?? []).map((l) => ({
      kind: "log" as const,
      id: l.id,
      created_at: l.created_at,
      date: l.date,
      author: l.author,
      title: l.title,
      duration_min: l.duration_min,
      rpe: l.rpe,
      exerciseCount: l.logged_exercises[0]?.count ?? 0,
    })),
    ...(tests.data ?? [])
      .filter((t) => t.test_types)
      .map((t) => ({
        kind: "test" as const,
        id: t.id,
        created_at: t.created_at,
        date: t.date,
        author: t.author,
        testName: t.test_types!.name,
        unit: t.test_types!.unit,
        value: Number(t.value),
      })),
    ...(plans.data ?? []).map((p) => ({
      kind: "plan" as const,
      id: p.id,
      created_at: p.created_at,
      author: p.author,
      title: p.title,
      goal: p.goal,
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50);

  return (
    <>
      <PageHeader
        title="Explore"
        description="Recent public sessions, test results and plans from other climbers."
        actions={
          <Link href="/plans/explore" className="btn-secondary">
            Browse plans
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {entries.length === 0 ? <EmptyState>Nothing shared yet.</EmptyState> : <Feed entries={entries} />}
        </div>
        <aside>
          <section className="card">
            <h2 className="mb-3 font-semibold">Climbers</h2>
            <ul className="space-y-1.5 text-sm">
              {(climbers.data ?? []).map((c) => (
                <li key={c.username}>
                  <Link href={`/u/${c.username}`} className="hover:underline">
                    <span className="font-medium">{c.display_name || c.username}</span>{" "}
                    <span className="text-stone-500">@{c.username}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
