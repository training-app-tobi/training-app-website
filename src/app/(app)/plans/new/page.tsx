import type { Metadata } from "next";
import { NewPlanForm } from "@/components/plan-forms";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "New plan" };

export default async function NewPlanPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="New plan" description="Start with the basics. You'll add blocks, weeks and sessions next." />
      <NewPlanForm />
    </>
  );
}
