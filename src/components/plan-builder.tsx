"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { savePlan } from "@/actions/plans";
import { VisibilityField } from "@/components/plan-forms";
import { FormMessage } from "@/components/ui";
import { WEEKDAYS_LONG } from "@/lib/dates";
import type { LibraryExercise, LibraryTest } from "@/lib/queries";
import { EXERCISE_CATEGORIES, type DayKind, type Visibility } from "@/lib/types";

// Numeric fields are kept as strings while editing; the server validates and converts them.
export type BuilderItem = {
  id: string;
  exercise_id: string | null;
  test_type_id: string | null;
  sets: string;
  reps: string;
  duration_sec: string;
  rest_sec: string;
  load_kg: string;
  edge_mm: string;
  grade: string;
  notes: string;
};
export type BuilderDay = {
  id: string;
  weekday: number;
  kind: DayKind;
  title: string;
  notes: string;
  items: BuilderItem[];
};
export type BuilderWeek = { id: string; days: BuilderDay[] };
export type BuilderBlock = { id: string; name: string; focus: string; weeks: BuilderWeek[] };
export type BuilderPlan = {
  title: string;
  description: string;
  goal: string;
  visibility: Visibility;
  blocks: BuilderBlock[];
};

type Props = {
  planId: string;
  initial: BuilderPlan;
  exercises: LibraryExercise[];
  tests: LibraryTest[];
};

const uid = () => crypto.randomUUID();

function move<T>(list: T[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}

function cloneWeek(week: BuilderWeek): BuilderWeek {
  return {
    id: uid(),
    days: week.days.map((d) => ({ ...d, id: uid(), items: d.items.map((i) => ({ ...i, id: uid() })) })),
  };
}

function emptyItem(target: { exercise_id?: string | null; test_type_id?: string | null }): BuilderItem {
  return {
    id: uid(),
    exercise_id: target.exercise_id ?? null,
    test_type_id: target.test_type_id ?? null,
    sets: "",
    reps: "",
    duration_sec: "",
    rest_sec: "",
    load_kg: "",
    edge_mm: "",
    grade: "",
    notes: "",
  };
}

export function PlanBuilder({ planId, initial, exercises, tests }: Props) {
  const [plan, setPlan] = useState<BuilderPlan>(initial);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<{ error?: string; ok?: string }>();
  const [pending, startTransition] = useTransition();
  // Long plans start collapsed; weeks you add or duplicate open automatically.
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(() => {
    const weeks = initial.blocks.flatMap((b) => b.weeks);
    return new Set(weeks.length <= 2 ? weeks.map((w) => w.id) : []);
  });
  const setWeekOpen = (id: string, open: boolean) =>
    setOpenWeeks((current) => {
      if (current.has(id) === open) return current;
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  const update = (fn: (draft: BuilderPlan) => void) => {
    setPlan((current) => {
      const draft = structuredClone(current);
      fn(draft);
      return draft;
    });
    setDirty(true);
    setState(undefined);
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    startTransition(async () => {
      const result = await savePlan(planId, plan);
      if (result.error) setState({ error: result.error });
      else {
        setDirty(false);
        setState({ ok: "Plan saved." });
      }
    });

  const exercisesByCategory = useMemo(
    () =>
      EXERCISE_CATEGORIES.map((c) => ({ ...c, items: exercises.filter((e) => e.category === c.value) })).filter(
        (c) => c.items.length > 0,
      ),
    [exercises],
  );

  const weekOffsets = plan.blocks.map((_, i) => plan.blocks.slice(0, i).reduce((n, b) => n + b.weeks.length, 0));
  const totalWeeks = plan.blocks.reduce((n, b) => n + b.weeks.length, 0);

  return (
    <div className="space-y-6 pb-24">
      <section className="card space-y-4">
        <h2 className="font-semibold">Plan details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="plan-title">
              Title
            </label>
            <input
              id="plan-title"
              className="input"
              value={plan.title}
              maxLength={120}
              onChange={(e) =>
                update((p) => {
                  p.title = e.target.value;
                })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="plan-goal">
              Goal
            </label>
            <input
              id="plan-goal"
              className="input"
              value={plan.goal}
              maxLength={300}
              onChange={(e) =>
                update((p) => {
                  p.goal = e.target.value;
                })
              }
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="plan-description">
            Description
          </label>
          <textarea
            id="plan-description"
            className="input"
            rows={2}
            value={plan.description}
            maxLength={5000}
            onChange={(e) =>
              update((p) => {
                p.description = e.target.value;
              })
            }
          />
        </div>
        <div
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.name === "plan-visibility")
              update((p) => {
                p.visibility = target.value as Visibility;
              });
          }}
        >
          <VisibilityField name="plan-visibility" defaultValue={plan.visibility} />
        </div>
      </section>

      {plan.blocks.map((block, bi) => (
        <section key={block.id} className="card space-y-4" aria-label={`Block ${bi + 1}`}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1">
              <label className="label" htmlFor={`block-${block.id}`}>
                Block {bi + 1} name
              </label>
              <input
                id={`block-${block.id}`}
                className="input"
                value={block.name}
                maxLength={80}
                placeholder="e.g. Strength"
                onChange={(e) =>
                  update((p) => {
                    p.blocks[bi].name = e.target.value;
                  })
                }
              />
            </div>
            <div className="min-w-40 flex-[2]">
              <label className="label" htmlFor={`focus-${block.id}`}>
                Focus
              </label>
              <input
                id={`focus-${block.id}`}
                className="input"
                value={block.focus}
                maxLength={300}
                placeholder="e.g. Max finger strength"
                onChange={(e) =>
                  update((p) => {
                    p.blocks[bi].focus = e.target.value;
                  })
                }
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="btn-ghost px-2"
                aria-label="Move block up"
                disabled={bi === 0}
                onClick={() => update((p) => move(p.blocks, bi, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn-ghost px-2"
                aria-label="Move block down"
                disabled={bi === plan.blocks.length - 1}
                onClick={() => update((p) => move(p.blocks, bi, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn-danger px-2.5"
                onClick={() =>
                  confirm(`Remove block “${block.name || bi + 1}” and all its weeks?`) &&
                  update((p) => {
                    p.blocks.splice(bi, 1);
                  })
                }
              >
                Remove block
              </button>
            </div>
          </div>

          {block.weeks.map((week, wi) => {
            const weekNumber = weekOffsets[bi] + wi + 1;
            const usedDays = new Set(week.days.map((d) => d.weekday));
            const freeDays = [1, 2, 3, 4, 5, 6, 7].filter((d) => !usedDays.has(d));
            const summary = week.days.length
              ? week.days.map((d) => `${WEEKDAYS_LONG[d.weekday - 1].slice(0, 3)} ${d.title}`).join(" · ")
              : "Rest week";
            return (
              <details
                key={week.id}
                open={openWeeks.has(week.id)}
                onToggle={(e) => setWeekOpen(week.id, e.currentTarget.open)}
                className="group rounded-lg border border-stone-200 bg-stone-50/60 p-3"
                aria-label={`Week ${weekNumber}`}
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
                    <span aria-hidden className="text-stone-400 transition-transform group-open:rotate-90">
                      ▸
                    </span>
                    <span className="font-semibold whitespace-nowrap">Week {weekNumber}</span>
                    <span className="truncate text-stone-500">{summary}</span>
                  </span>
                  <span className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        const copy = cloneWeek(week);
                        update((p) => {
                          p.blocks[bi].weeks.splice(wi + 1, 0, copy);
                        });
                        setWeekOpen(copy.id, true);
                      }}
                    >
                      Duplicate week
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-xs text-red-700"
                      disabled={block.weeks.length === 1}
                      onClick={(e) => {
                        e.preventDefault();
                        update((p) => {
                          p.blocks[bi].weeks.splice(wi, 1);
                        });
                      }}
                    >
                      Remove week
                    </button>
                  </span>
                </summary>

                <div className="mt-3 space-y-3">
                  {week.days.map((day, di) => (
                    <DayEditor
                      key={day.id}
                      day={day}
                      freeDays={freeDays}
                      exercisesByCategory={exercisesByCategory}
                      tests={tests}
                      onChange={(fn) => update((p) => fn(p.blocks[bi].weeks[wi].days[di]))}
                      onRemove={() =>
                        update((p) => {
                          p.blocks[bi].weeks[wi].days.splice(di, 1);
                        })
                      }
                      defaultExercise={exercises[0]?.id ?? null}
                      defaultTest={tests[0]?.id ?? null}
                    />
                  ))}
                </div>

                {freeDays.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-2.5 py-1.5 text-xs"
                      onClick={() =>
                        update((p) => {
                          const days = p.blocks[bi].weeks[wi].days;
                          days.push({
                            id: uid(),
                            weekday: freeDays[0],
                            kind: "training",
                            title: "Training",
                            notes: "",
                            items: [],
                          });
                          days.sort((a, b) => a.weekday - b.weekday);
                        })
                      }
                    >
                      + Training day
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2.5 py-1.5 text-xs"
                      onClick={() =>
                        update((p) => {
                          const days = p.blocks[bi].weeks[wi].days;
                          days.push({
                            id: uid(),
                            weekday: freeDays[freeDays.length - 1],
                            kind: "test",
                            title: "Test day",
                            notes: "",
                            items: tests[0] ? [emptyItem({ test_type_id: tests[0].id })] : [],
                          });
                          days.sort((a, b) => a.weekday - b.weekday);
                        })
                      }
                    >
                      + Test day
                    </button>
                  </div>
                )}
              </details>
            );
          })}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const last = block.weeks[block.weeks.length - 1];
              const week = last ? cloneWeek(last) : { id: uid(), days: [] };
              update((p) => {
                p.blocks[bi].weeks.push(week);
              });
              setWeekOpen(week.id, true);
            }}
          >
            + Add week
          </button>
        </section>
      ))}

      <button
        type="button"
        className="btn-secondary w-full py-3"
        onClick={() => {
          const week = { id: uid(), days: [] };
          update((p) => {
            p.blocks.push({ id: uid(), name: `Block ${p.blocks.length + 1}`, focus: "", weeks: [week] });
          });
          setWeekOpen(week.id, true);
        }}
      >
        + Add block
      </button>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            {state ? (
              <FormMessage state={state} />
            ) : (
              <span className="text-sm text-stone-600">{dirty ? "Unsaved changes" : `${totalWeeks} weeks`}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/plans/${planId}`} className="btn-secondary">
              {dirty ? "Discard" : "Done"}
            </Link>
            <button type="button" className="btn-primary" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DayEditorProps = {
  day: BuilderDay;
  freeDays: number[];
  exercisesByCategory: { value: string; label: string; items: LibraryExercise[] }[];
  tests: LibraryTest[];
  onChange: (fn: (day: BuilderDay) => void) => void;
  onRemove: () => void;
  defaultExercise: string | null;
  defaultTest: string | null;
};

function DayEditor({
  day,
  freeDays,
  exercisesByCategory,
  tests,
  onChange,
  onRemove,
  defaultExercise,
  defaultTest,
}: DayEditorProps) {
  const weekdayOptions = [day.weekday, ...freeDays].sort((a, b) => a - b);
  return (
    <div className={`rounded-lg border bg-white p-3 ${day.kind === "test" ? "border-sky-200" : "border-stone-200"}`}>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-stone-500" htmlFor={`wd-${day.id}`}>
            Day
          </label>
          <select
            id={`wd-${day.id}`}
            className="input-sm"
            value={day.weekday}
            onChange={(e) =>
              onChange((d) => {
                d.weekday = Number(e.target.value);
              })
            }
          >
            {weekdayOptions.map((w) => (
              <option key={w} value={w}>
                {WEEKDAYS_LONG[w - 1]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500" htmlFor={`kind-${day.id}`}>
            Type
          </label>
          <select
            id={`kind-${day.id}`}
            className="input-sm"
            value={day.kind}
            onChange={(e) =>
              onChange((d) => {
                d.kind = e.target.value as DayKind;
              })
            }
          >
            <option value="training">Training</option>
            <option value="test">Test</option>
          </select>
        </div>
        <div className="min-w-40 flex-1">
          <label className="text-xs text-stone-500" htmlFor={`title-${day.id}`}>
            Session title
          </label>
          <input
            id={`title-${day.id}`}
            className="input-sm"
            value={day.title}
            maxLength={80}
            onChange={(e) =>
              onChange((d) => {
                d.title = e.target.value;
              })
            }
          />
        </div>
        <button type="button" className="btn-ghost px-2 py-1 text-xs text-red-700" onClick={onRemove}>
          Remove day
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {day.items.map((item, ii) => (
          <div key={item.id} className="rounded-md bg-stone-50 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Exercise or test"
                className="input-sm max-w-full flex-1 sm:max-w-xs"
                value={item.exercise_id ? `ex:${item.exercise_id}` : item.test_type_id ? `tt:${item.test_type_id}` : ""}
                onChange={(e) =>
                  onChange((d) => {
                    const [kind, id] = e.target.value.split(":");
                    d.items[ii].exercise_id = kind === "ex" ? id : null;
                    d.items[ii].test_type_id = kind === "tt" ? id : null;
                  })
                }
              >
                {!item.exercise_id && !item.test_type_id && <option value="">Removed exercise</option>}
                {exercisesByCategory.map((group) => (
                  <optgroup key={group.value} label={group.label}>
                    {group.items.map((ex) => (
                      <option key={ex.id} value={`ex:${ex.id}`}>
                        {ex.name}
                        {ex.is_built_in ? "" : " (custom)"}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="Tests">
                  {tests.map((t) => (
                    <option key={t.id} value={`tt:${t.id}`}>
                      {t.name}
                      {t.is_built_in ? "" : " (custom)"}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="ml-auto flex gap-1">
                <button
                  type="button"
                  className="btn-ghost px-1.5 py-0.5 text-xs"
                  aria-label="Move up"
                  disabled={ii === 0}
                  onClick={() => onChange((d) => move(d.items, ii, -1))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost px-1.5 py-0.5 text-xs"
                  aria-label="Move down"
                  disabled={ii === day.items.length - 1}
                  onClick={() => onChange((d) => move(d.items, ii, 1))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-ghost px-1.5 py-0.5 text-xs text-red-700"
                  aria-label="Remove item"
                  onClick={() =>
                    onChange((d) => {
                      d.items.splice(ii, 1);
                    })
                  }
                >
                  ✕
                </button>
              </div>
            </div>
            {item.exercise_id && (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-7">
                <NumberField
                  label="Sets"
                  value={item.sets}
                  onChange={(v) =>
                    onChange((d) => {
                      d.items[ii].sets = v;
                    })
                  }
                />
                <NumberField
                  label="Reps"
                  value={item.reps}
                  onChange={(v) =>
                    onChange((d) => {
                      d.items[ii].reps = v;
                    })
                  }
                />
                <NumberField
                  label="Time (s)"
                  value={item.duration_sec}
                  onChange={(v) =>
                    onChange((d) => {
                      d.items[ii].duration_sec = v;
                    })
                  }
                />
                <NumberField
                  label="Rest (s)"
                  value={item.rest_sec}
                  onChange={(v) =>
                    onChange((d) => {
                      d.items[ii].rest_sec = v;
                    })
                  }
                />
                <NumberField
                  label="Load (kg)"
                  value={item.load_kg}
                  step="0.5"
                  onChange={(v) =>
                    onChange((d) => {
                      d.items[ii].load_kg = v;
                    })
                  }
                />
                <NumberField
                  label="Edge (mm)"
                  value={item.edge_mm}
                  step="0.5"
                  onChange={(v) =>
                    onChange((d) => {
                      d.items[ii].edge_mm = v;
                    })
                  }
                />
                <label className="text-xs text-stone-500">
                  Grade
                  <input
                    className="input-sm"
                    value={item.grade}
                    maxLength={10}
                    onChange={(e) =>
                      onChange((d) => {
                        d.items[ii].grade = e.target.value;
                      })
                    }
                  />
                </label>
              </div>
            )}
            <input
              aria-label="Notes"
              className="input-sm mt-2"
              placeholder="Notes (optional)"
              value={item.notes}
              maxLength={1000}
              onChange={(e) =>
                onChange((d) => {
                  d.items[ii].notes = e.target.value;
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {defaultExercise && (
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() =>
              onChange((d) => {
                d.items.push(emptyItem({ exercise_id: defaultExercise }));
              })
            }
          >
            + Exercise
          </button>
        )}
        {defaultTest && (
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() =>
              onChange((d) => {
                d.items.push(emptyItem({ test_type_id: defaultTest }));
              })
            }
          >
            + Test
          </button>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="text-xs text-stone-500">
      {label}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        className="input-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
