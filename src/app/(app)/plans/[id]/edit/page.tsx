import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlanBuilder, type BuilderPlan } from "@/components/plan-builder";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLibrary, getPlanTree, type LibraryExercise, type LibraryTest } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit plan" };

const str = (v: number | string | null) => (v === null ? "" : String(v));

export default async function EditPlanPage({ params }: PageProps<"/plans/[id]/edit">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const [plan, library] = await Promise.all([getPlanTree(supabase, id), getLibrary(supabase, userId)]);
  if (!plan) notFound();
  if (plan.owner_id !== userId) redirect(`/plans/${id}`);

  // Keep definitions the plan already uses (e.g. another climber's custom exercise from a copied plan).
  const exercises: LibraryExercise[] = [...library.exercises];
  const tests: LibraryTest[] = [...library.tests];
  for (const item of plan.blocks.flatMap((b) => b.weeks.flatMap((w) => w.days.flatMap((d) => d.items)))) {
    if (item.exercise_id && item.exercises && !exercises.some((e) => e.id === item.exercise_id)) {
      exercises.push({
        id: item.exercise_id,
        name: item.exercises.name,
        category: item.exercises.category,
        is_built_in: false,
      });
    }
    if (item.test_type_id && item.test_types && !tests.some((t) => t.id === item.test_type_id)) {
      tests.push({
        id: item.test_type_id,
        name: item.test_types.name,
        unit: item.test_types.unit,
        category: "other",
        is_built_in: false,
      });
    }
  }

  const initial: BuilderPlan = {
    title: plan.title,
    description: plan.description ?? "",
    goal: plan.goal ?? "",
    visibility: plan.visibility,
    blocks: plan.blocks.map((b) => ({
      id: b.id,
      name: b.name,
      focus: b.focus ?? "",
      weeks: b.weeks.map((w) => ({
        id: w.id,
        days: w.days.map((d) => ({
          id: d.id,
          weekday: d.weekday,
          kind: d.kind,
          title: d.title,
          notes: d.notes ?? "",
          items: d.items.map((i) => ({
            id: i.id,
            exercise_id: i.exercise_id,
            test_type_id: i.test_type_id,
            sets: str(i.sets),
            reps: str(i.reps),
            duration_sec: str(i.duration_sec),
            rest_sec: str(i.rest_sec),
            load_kg: str(i.load_kg),
            edge_mm: str(i.edge_mm),
            grade: i.grade ?? "",
            notes: i.notes ?? "",
          })),
        })),
      })),
    })),
  };

  return (
    <>
      <PageHeader
        title="Edit plan"
        description="Blocks run in order. Each week starts on Monday; add training or test days to the weekdays you want."
      />
      <PlanBuilder planId={id} initial={initial} exercises={exercises} tests={tests} />
    </>
  );
}
