import type { Metadata } from "next";
import Link from "next/link";
import { archiveExercise, archiveTestType } from "@/actions/exercises";
import { ConfirmButton } from "@/components/form-controls";
import { NewExerciseForm, NewTestTypeForm } from "@/components/library-forms";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { EXERCISE_CATEGORIES, exerciseCategoryLabel, testCategoryLabel, testUnitLabel } from "@/lib/types";

export const metadata: Metadata = { title: "Exercise library" };

export default async function ExercisesPage({ searchParams }: PageProps<"/exercises">) {
  const { supabase, userId } = await requireUser();
  const { category } = await searchParams;
  const selected = EXERCISE_CATEGORIES.find((c) => c.value === category)?.value ?? null;

  let exerciseQuery = supabase
    .from("exercises")
    .select("id, name, category, description, is_built_in, owner_id")
    .or(`is_built_in.eq.true,owner_id.eq.${userId}`)
    .is("archived_at", null)
    .order("is_built_in", { ascending: false })
    .order("name");
  if (selected) exerciseQuery = exerciseQuery.eq("category", selected);

  const [{ data: exercises }, { data: tests }] = await Promise.all([
    exerciseQuery,
    supabase
      .from("test_types")
      .select("id, name, category, unit, higher_is_better, protocol, is_built_in, owner_id")
      .or(`is_built_in.eq.true,owner_id.eq.${userId}`)
      .is("archived_at", null)
      .order("category")
      .order("name"),
  ]);

  return (
    <>
      <PageHeader
        title="Exercise library"
        description="Built-in exercises and tests, plus your own custom ones. Use them in plans and logs."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 font-semibold">Exercises</h2>
            <nav className="mb-3 flex flex-wrap gap-1.5" aria-label="Filter by category">
              <Link
                href="/exercises"
                className={`rounded-full px-3 py-1 text-xs font-medium ${!selected ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"}`}
              >
                All
              </Link>
              {EXERCISE_CATEGORIES.map((c) => (
                <Link
                  key={c.value}
                  href={`/exercises?category=${c.value}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${selected === c.value ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"}`}
                >
                  {c.label}
                </Link>
              ))}
            </nav>
            <ul className="card divide-y divide-stone-100 p-0 sm:p-0">
              {(exercises ?? []).map((ex) => (
                <li key={ex.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{ex.name}</span>
                      <Badge>{exerciseCategoryLabel(ex.category)}</Badge>
                      {!ex.is_built_in && <Badge tone="accent">Custom</Badge>}
                    </div>
                    {ex.description && <p className="mt-0.5 text-sm text-stone-600">{ex.description}</p>}
                  </div>
                  {ex.owner_id === userId && (
                    <ConfirmButton
                      action={archiveExercise.bind(null, ex.id)}
                      className="btn-ghost px-2 py-1 text-xs text-red-700"
                      confirm="Archive this exercise? Plans and logs that use it keep working."
                    >
                      Archive
                    </ConfirmButton>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Tests</h2>
            <ul className="card divide-y divide-stone-100 p-0 sm:p-0">
              {(tests ?? []).map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      <Badge tone="blue">{testCategoryLabel(t.category)}</Badge>
                      {!t.is_built_in && <Badge tone="accent">Custom</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {testUnitLabel(t.unit)} · {t.higher_is_better ? "higher is better" : "lower is better"}
                    </p>
                    {t.protocol && <p className="mt-0.5 text-sm text-stone-600">{t.protocol}</p>}
                  </div>
                  {t.owner_id === userId && (
                    <ConfirmButton
                      action={archiveTestType.bind(null, t.id)}
                      className="btn-ghost px-2 py-1 text-xs text-red-700"
                      confirm="Archive this test? Existing results are kept."
                    >
                      Archive
                    </ConfirmButton>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="mb-3 font-semibold">New custom exercise</h2>
            <NewExerciseForm />
          </section>
          <section className="card">
            <h2 className="mb-3 font-semibold">New custom test</h2>
            <NewTestTypeForm />
          </section>
        </aside>
      </div>
    </>
  );
}
