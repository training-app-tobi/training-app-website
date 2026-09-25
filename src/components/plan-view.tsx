import { weekdayName } from "@/lib/dates";
import { formatPrescription } from "@/lib/format";
import type { PlanTree } from "@/lib/queries";
import { testUnitLabel } from "@/lib/types";

export function PlanView({ plan }: { plan: PlanTree }) {
  if (plan.blocks.length === 0) {
    return <p className="text-sm text-stone-600">This plan has no blocks yet.</p>;
  }
  const weekOffsets = plan.blocks.map((_, i) => plan.blocks.slice(0, i).reduce((n, b) => n + b.weeks.length, 0));
  return (
    <div className="space-y-6">
      {plan.blocks.map((block, bi) => (
        <section key={block.id} className="card">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{block.name}</h2>
            <span className="text-sm text-stone-500">
              {block.weeks.length} {block.weeks.length === 1 ? "week" : "weeks"}
            </span>
          </div>
          {block.focus && <p className="-mt-2 mb-3 text-sm text-stone-600">{block.focus}</p>}
          <div className="space-y-4">
            {block.weeks.map((week, wi) => {
              const weekNumber = weekOffsets[bi] + wi + 1;
              return (
                <div key={week.id}>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                    Week {weekNumber}
                  </h3>
                  {week.days.length === 0 ? (
                    <p className="text-sm text-stone-500">Rest week.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {week.days.map((day) => (
                        <div
                          key={day.id}
                          className={`rounded-lg border p-3 ${day.kind === "test" ? "border-sky-200 bg-sky-50/60" : "border-stone-200"}`}
                        >
                          <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="font-medium">
                              {day.kind === "test" ? "🎯 " : ""}
                              {day.title}
                            </span>
                            <span className="text-xs text-stone-500">{weekdayName(day.weekday)}</span>
                          </div>
                          {day.notes && <p className="mb-1 text-xs text-stone-600">{day.notes}</p>}
                          <ul className="space-y-1 text-sm">
                            {day.items.map((item) => (
                              <li key={item.id}>
                                <span className="font-medium text-stone-800">
                                  {item.exercises?.name ?? item.test_types?.name ?? "Removed exercise"}
                                </span>
                                {item.test_types && (
                                  <span className="text-xs text-stone-500">
                                    {" "}
                                    · {testUnitLabel(item.test_types.unit)}
                                  </span>
                                )}
                                {formatPrescription(item) && (
                                  <span className="block text-xs text-stone-600">{formatPrescription(item)}</span>
                                )}
                                {item.notes && (
                                  <span className="block text-xs text-stone-500 italic">{item.notes}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
