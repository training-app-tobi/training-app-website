"use client";

import { useMemo, useState, useTransition } from "react";
import { saveLog } from "@/actions/logs";
import { FormMessage } from "@/components/ui";
import type { LibraryExercise } from "@/lib/queries";
import { EXERCISE_CATEGORIES, type Visibility } from "@/lib/types";

export type LogExerciseRow = {
  key: string;
  exercise_id: string;
  sets: string;
  reps: string;
  duration_sec: string;
  load_kg: string;
  edge_mm: string;
  grade: string;
  notes: string;
  completed: boolean;
};

export type LogFormValues = {
  date: string;
  title: string;
  scheduled_session_id: string | null;
  duration_min: string;
  rpe: string;
  notes: string;
  visibility: Visibility;
  exercises: LogExerciseRow[];
};

type Props = {
  logId: string | null;
  initial: LogFormValues;
  exercises: LibraryExercise[];
  plannedLabel?: string;
};

export function LogForm({ logId, initial, exercises, plannedLabel }: Props) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof LogFormValues>(key: K, value: LogFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setRow = (index: number, patch: Partial<LogExerciseRow>) =>
    setValues((v) => ({ ...v, exercises: v.exercises.map((row, i) => (i === index ? { ...row, ...patch } : row)) }));

  const grouped = useMemo(
    () =>
      EXERCISE_CATEGORIES.map((c) => ({ ...c, items: exercises.filter((e) => e.category === c.value) })).filter(
        (c) => c.items.length > 0,
      ),
    [exercises],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      // The schema strips the client-only `key` field.
      const result = await saveLog(logId, values);
      // On success the action redirects; we only get here on error.
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {plannedLabel && (
        <p className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
          Logging planned session: <strong>{plannedLabel}</strong>
        </p>
      )}
      <FormMessage state={{ error }} />

      <section className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="input"
            required
            maxLength={120}
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Board session"
          />
        </div>
        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="input"
            required
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="duration_min">
              Minutes
            </label>
            <input
              id="duration_min"
              type="number"
              min={1}
              max={1440}
              className="input"
              value={values.duration_min}
              onChange={(e) => set("duration_min", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="rpe">
              RPE
            </label>
            <select id="rpe" className="input" value={values.rpe} onChange={(e) => set("rpe", e.target.value)}>
              <option value="">–</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="input"
            rows={3}
            maxLength={5000}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="How did it feel? Anything to remember?"
          />
        </div>
        <fieldset className="sm:col-span-2 lg:col-span-4">
          <legend className="label">Visibility</legend>
          <div className="flex gap-4 text-sm">
            {(["public", "private"] as const).map((v) => (
              <label key={v} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={values.visibility === v}
                  onChange={() => set("visibility", v)}
                />
                {v === "public" ? "Public — other climbers can see it" : "Private — only you"}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Exercises</h2>
          <button
            type="button"
            className="btn-secondary px-2.5 py-1.5 text-sm"
            disabled={exercises.length === 0}
            onClick={() =>
              setValues((v) => ({
                ...v,
                exercises: [
                  ...v.exercises,
                  {
                    key: crypto.randomUUID(),
                    exercise_id: exercises[0].id,
                    sets: "",
                    reps: "",
                    duration_sec: "",
                    load_kg: "",
                    edge_mm: "",
                    grade: "",
                    notes: "",
                    completed: true,
                  },
                ],
              }))
            }
          >
            + Add exercise
          </button>
        </div>
        {values.exercises.length === 0 && (
          <p className="text-sm text-stone-500">No exercises added. That&apos;s fine for a simple log.</p>
        )}
        {values.exercises.map((row, i) => (
          <div key={row.key} className="rounded-lg border border-stone-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Exercise"
                className="input-sm max-w-full flex-1 sm:max-w-xs"
                value={row.exercise_id}
                onChange={(e) => setRow(i, { exercise_id: e.target.value })}
              >
                {grouped.map((g) => (
                  <optgroup key={g.value} label={g.label}>
                    {g.items.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <label className="inline-flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={row.completed}
                  onChange={(e) => setRow(i, { completed: e.target.checked })}
                />
                Completed
              </label>
              <button
                type="button"
                className="btn-ghost ml-auto px-2 py-1 text-xs text-red-700"
                onClick={() => setValues((v) => ({ ...v, exercises: v.exercises.filter((_, j) => j !== i) }))}
              >
                Remove
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(
                [
                  ["sets", "Sets", "1"],
                  ["reps", "Reps", "1"],
                  ["duration_sec", "Time (s)", "1"],
                  ["load_kg", "Load (kg)", "0.5"],
                  ["edge_mm", "Edge (mm)", "0.5"],
                ] as const
              ).map(([field, label, step]) => (
                <label key={field} className="text-xs text-stone-500">
                  {label}
                  <input
                    type="number"
                    step={step}
                    inputMode="decimal"
                    className="input-sm"
                    value={row[field]}
                    onChange={(e) => setRow(i, { [field]: e.target.value })}
                  />
                </label>
              ))}
              <label className="text-xs text-stone-500">
                Grade
                <input
                  className="input-sm"
                  maxLength={10}
                  value={row.grade}
                  onChange={(e) => setRow(i, { grade: e.target.value })}
                />
              </label>
            </div>
            <input
              aria-label="Exercise notes"
              className="input-sm mt-2"
              placeholder="Notes (optional)"
              maxLength={1000}
              value={row.notes}
              onChange={(e) => setRow(i, { notes: e.target.value })}
            />
          </div>
        ))}
      </section>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : logId ? "Save changes" : "Save session"}
        </button>
      </div>
    </form>
  );
}
