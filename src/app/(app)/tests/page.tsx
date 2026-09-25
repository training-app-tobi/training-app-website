import type { Metadata } from "next";
import Link from "next/link";
import { TestHistory } from "@/components/test-history";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getTestRows } from "@/lib/test-rows";

export const metadata: Metadata = { title: "My tests" };

export default async function TestsPage() {
  const { supabase, userId } = await requireUser();
  const rows = await getTestRows(supabase, userId);
  return (
    <>
      <PageHeader
        title="My tests"
        description="Benchmarks you record at the end of a block. Best results and trends per test."
        actions={
          <Link href="/tests/new" className="btn-primary">
            Log test
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          action={
            <Link href="/tests/new" className="btn-primary">
              Log your first test
            </Link>
          }
        >
          No test results yet. Try a max hang or a max pull-up test to get a baseline.
        </EmptyState>
      ) : (
        <TestHistory rows={rows} isOwner />
      )}
    </>
  );
}
