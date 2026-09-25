import Link from "next/link";
import { UserLink } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatTestValue } from "@/lib/format";
import type { TestUnit } from "@/lib/types";

type Author = { username: string; display_name: string | null } | null;

export type FeedEntry =
  | {
      kind: "log";
      id: string;
      created_at: string;
      date: string;
      author: Author;
      title: string;
      duration_min: number | null;
      rpe: number | null;
      exerciseCount: number;
    }
  | {
      kind: "test";
      id: string;
      created_at: string;
      date: string;
      author: Author;
      testName: string;
      unit: TestUnit;
      value: number;
    }
  | { kind: "plan"; id: string; created_at: string; author: Author; title: string; goal: string | null };

export function Feed({ entries }: { entries: FeedEntry[] }) {
  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li key={`${e.kind}-${e.id}`} className="card flex gap-3 p-4 sm:p-4">
          <span
            aria-hidden
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
              e.kind === "log" ? "bg-accent-100" : e.kind === "test" ? "bg-sky-100" : "bg-stone-100"
            }`}
          >
            {e.kind === "log" ? "🧗" : e.kind === "test" ? "🎯" : "📋"}
          </span>
          <div className="min-w-0 text-sm">
            {e.kind === "log" && (
              <>
                <p>
                  <UserLink profile={e.author} /> logged{" "}
                  <Link href={`/logs/${e.id}`} className="font-semibold hover:underline">
                    {e.title}
                  </Link>
                </p>
                <p className="text-xs text-stone-500">
                  {formatDate(e.date)}
                  {e.duration_min ? ` · ${e.duration_min} min` : ""}
                  {e.rpe ? ` · RPE ${e.rpe}` : ""}
                  {e.exerciseCount ? ` · ${e.exerciseCount} exercises` : ""}
                </p>
              </>
            )}
            {e.kind === "test" && (
              <>
                <p>
                  <UserLink profile={e.author} /> tested <span className="font-semibold">{e.testName}</span>:{" "}
                  <span className="font-semibold text-sky-800">{formatTestValue(e.unit, e.value)}</span>
                </p>
                <p className="text-xs text-stone-500">{formatDate(e.date)}</p>
              </>
            )}
            {e.kind === "plan" && (
              <>
                <p>
                  <UserLink profile={e.author} /> shared a plan:{" "}
                  <Link href={`/plans/${e.id}`} className="font-semibold hover:underline">
                    {e.title}
                  </Link>
                </p>
                {e.goal && <p className="text-xs text-stone-500">Goal: {e.goal}</p>}
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
