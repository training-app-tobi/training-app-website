import { deleteTestResult } from "@/actions/tests";
import { ConfirmButton } from "@/components/form-controls";
import { VisibilityBadge } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatTestValue, percentBodyweight } from "@/lib/format";
import { testCategoryLabel, type TestUnit, type Visibility } from "@/lib/types";

export type TestResultRow = {
  id: string;
  date: string;
  value: number;
  bodyweight_kg: number | null;
  notes: string | null;
  visibility: Visibility;
  test_types: { id: string; name: string; unit: TestUnit; higher_is_better: boolean; category: string } | null;
};

type Group = {
  type: NonNullable<TestResultRow["test_types"]>;
  results: TestResultRow[]; // oldest first
};

function groupByType(rows: TestResultRow[]): Group[] {
  const groups = new Map<string, Group>();
  for (const row of rows) {
    if (!row.test_types) continue;
    const group = groups.get(row.test_types.id) ?? { type: row.test_types, results: [] };
    group.results.push(row);
    groups.set(row.test_types.id, group);
  }
  for (const g of groups.values()) g.results.sort((a, b) => a.date.localeCompare(b.date));
  return [...groups.values()].sort(
    (a, b) => a.type.category.localeCompare(b.type.category) || a.type.name.localeCompare(b.type.name),
  );
}

/** One stat tile per test type (best, latest, trend) plus the full history as a table. */
export function TestHistory({ rows, isOwner }: { rows: TestResultRow[]; isOwner: boolean }) {
  const groups = groupByType(rows);
  return (
    <div className="space-y-6">
      {groups.map(({ type, results }) => {
        const better = (a: number, b: number) => (type.higher_is_better ? a > b : a < b);
        const best = results.reduce((b, r) => (better(r.value, b.value) ? r : b), results[0]);
        const latest = results[results.length - 1];
        const previous = results[results.length - 2];
        const improved = previous ? better(latest.value, previous.value) : null;
        const same = previous ? latest.value === previous.value : false;
        const relative = type.unit === "kg_added" ? percentBodyweight(best.value, best.bodyweight_kg) : null;

        return (
          <section key={type.id} className="card" aria-label={type.name}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                  {testCategoryLabel(type.category)}
                </div>
                <h2 className="font-semibold">{type.name}</h2>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-semibold text-stone-900">
                    {formatTestValue(type.unit, best.value)}
                  </span>
                  <span className="text-sm text-stone-500">
                    best · {formatDate(best.date, "d MMM yyyy")}
                    {relative ? ` · ${relative}` : ""}
                  </span>
                </div>
                {previous && (
                  <p className="mt-1 text-sm text-stone-600">
                    Latest {formatTestValue(type.unit, latest.value)}{" "}
                    {same ? (
                      <span className="text-stone-500">(= previous)</span>
                    ) : improved ? (
                      <span className="font-medium text-emerald-700">▲ better than previous</span>
                    ) : (
                      <span className="font-medium text-red-700">▼ worse than previous</span>
                    )}
                  </p>
                )}
              </div>
              {results.length > 1 && <Sparkline results={results} unit={type.unit} />}
            </div>

            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">{type.name} history</caption>
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  <th className="py-1 font-medium">Date</th>
                  <th className="py-1 font-medium">Result</th>
                  <th className="hidden py-1 font-medium sm:table-cell">Notes</th>
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody>
                {[...results].reverse().map((r) => (
                  <tr key={r.id} className="border-b border-stone-100 last:border-0">
                    <td className="py-1.5 whitespace-nowrap tabular-nums">{formatDate(r.date, "d MMM yyyy")}</td>
                    <td className="py-1.5 font-medium tabular-nums">
                      {formatTestValue(type.unit, r.value)}
                      {r.id === best.id && <span className="ml-1 text-xs text-accent-700">best</span>}
                    </td>
                    <td className="hidden max-w-xs truncate py-1.5 text-stone-600 sm:table-cell">{r.notes}</td>
                    <td className="py-1.5 text-right">
                      <span className="inline-flex items-center gap-2">
                        {r.visibility === "private" && <VisibilityBadge visibility="private" />}
                        {isOwner && (
                          <ConfirmButton
                            action={deleteTestResult.bind(null, r.id)}
                            confirm="Delete this result?"
                            className="btn-ghost px-1.5 py-0.5 text-xs text-red-700"
                          >
                            Delete
                          </ConfirmButton>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

/** Trend of one test: recessive line, latest point in the accent. Hover a point for its value. */
function Sparkline({ results, unit }: { results: TestResultRow[]; unit: TestUnit }) {
  const points = results.slice(-12);
  const width = 160;
  const height = 48;
  const pad = 6;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Edge depth: smaller is better, so flip the axis to keep "up = better".
  const flip = unit === "mm";
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => {
    const t = max === min ? 0.5 : (v - min) / (max - min);
    return pad + (flip ? t : 1 - t) * (height - pad * 2);
  };
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend over the last ${points.length} results`}
      className="shrink-0 overflow-visible"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--color-stone-400)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => {
        const last = i === points.length - 1;
        return (
          <g key={p.id}>
            {/* Large transparent hit target, smaller visible mark. */}
            <circle cx={x(i)} cy={y(p.value)} r={9} fill="transparent">
              <title>{`${formatDate(p.date, "d MMM yyyy")}: ${formatTestValue(unit, p.value)}`}</title>
            </circle>
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={last ? 4 : 2.5}
              pointerEvents="none"
              fill={last ? "var(--color-accent-600)" : "var(--color-stone-400)"}
              stroke="white"
              strokeWidth={last ? 2 : 0}
            />
          </g>
        );
      })}
    </svg>
  );
}
