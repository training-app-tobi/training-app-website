"use client";

import { useState, useTransition } from "react";
import { saveTestResults } from "@/actions/tests";
import { FormMessage } from "@/components/ui";
import { FONT_GRADES, FRENCH_GRADES } from "@/lib/grades";
import type { LibraryTest } from "@/lib/queries";
import { TEST_CATEGORIES, testUnitLabel, type TestUnit, type Visibility } from "@/lib/types";

type Row = { key: string; test_type_id: string; value: string };

export type TestFormInitial = {
  date: string;
  bodyweight_kg: string;
  scheduled_session_id: string | null;
  test_type_ids: string[];
};

const PLACEHOLDER: Record<TestUnit, string> = {
  kg_added: "e.g. 15 (negative if assisted)",
  mm: "e.g. 12",
  reps: "e.g. 14",
  seconds: "e.g. 8",
  font_grade: "",
  french_grade: "",
};

export function TestForm({
  tests,
  initial,
  plannedLabel,
}: {
  tests: LibraryTest[];
  initial: TestFormInitial;
  plannedLabel?: string;
}) {
  const [date, setDate] = useState(initial.date);
  const [bodyweight, setBodyweight] = useState(initial.bodyweight_kg);
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [rows, setRows] = useState<Row[]>(() =>
    // Deterministic keys for the first render so server and client HTML match.
    (initial.test_type_ids.length ? initial.test_type_ids : ([tests[0]?.id].filter(Boolean) as string[])).map(
      (id, i) => ({
        key: `initial-${i}`,
        test_type_id: id,
        value: "",
      }),
    ),
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const unitOf = (id: string) => tests.find((t) => t.id === id)?.unit ?? "reps";
  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const filled = rows.filter((r) => r.value !== "");
    if (filled.length === 0) return setError("Enter at least one result.");
    startTransition(async () => {
      const result = await saveTestResults({
        date,
        bodyweight_kg: bodyweight,
        notes,
        visibility,
        scheduled_session_id: initial.scheduled_session_id,
        results: filled.map((r) => ({ test_type_id: r.test_type_id, value: Number(r.value) })),
      });
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      {plannedLabel && (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          Logging planned test day: <strong>{plannedLabel}</strong>
        </p>
      )}
      <FormMessage state={{ error }} />

      <section className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="input"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="bodyweight">
            Bodyweight (kg)
          </label>
          <input
            id="bodyweight"
            type="number"
            step="0.1"
            min={20}
            max={250}
            className="input"
            value={bodyweight}
            onChange={(e) => setBodyweight(e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-500">Used to show strength relative to bodyweight.</p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Results</h2>
          <button
            type="button"
            className="btn-secondary px-2.5 py-1.5 text-sm"
            disabled={tests.length === 0}
            onClick={() => setRows((r) => [...r, { key: crypto.randomUUID(), test_type_id: tests[0].id, value: "" }])}
          >
            + Add test
          </button>
        </div>
        {rows.map((row, i) => {
          const unit = unitOf(row.test_type_id);
          const grades = unit === "font_grade" ? FONT_GRADES : unit === "french_grade" ? FRENCH_GRADES : null;
          return (
            <div key={row.key} className="grid items-end gap-2 sm:grid-cols-[1fr_12rem_auto]">
              <div className="text-sm">
                <label className="label" htmlFor={`test-${row.key}`}>
                  Test
                </label>
                <select
                  id={`test-${row.key}`}
                  className="input"
                  value={row.test_type_id}
                  onChange={(e) => setRow(i, { test_type_id: e.target.value, value: "" })}
                >
                  {TEST_CATEGORIES.map((c) => {
                    const items = tests.filter((t) => t.category === c.value);
                    return items.length ? (
                      <optgroup key={c.value} label={c.label}>
                        {items.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null;
                  })}
                </select>
              </div>
              <div className="text-sm">
                <label className="label" htmlFor={`value-${row.key}`}>
                  {testUnitLabel(unit)}
                </label>
                {grades ? (
                  <select
                    id={`value-${row.key}`}
                    className="input"
                    value={row.value}
                    onChange={(e) => setRow(i, { value: e.target.value })}
                  >
                    <option value="">Pick a grade</option>
                    {grades.map((g, index) => (
                      <option key={g} value={index}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`value-${row.key}`}
                    type="number"
                    step={unit === "kg_added" || unit === "mm" ? "0.5" : "1"}
                    className="input"
                    placeholder={PLACEHOLDER[unit]}
                    value={row.value}
                    onChange={(e) => setRow(i, { value: e.target.value })}
                  />
                )}
              </div>
              <button
                type="button"
                className="btn-ghost text-red-700"
                disabled={rows.length === 1}
                onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          );
        })}
      </section>

      <section className="card space-y-4">
        <div>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className="input"
            rows={2}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Conditions, warm-up, how it felt…"
          />
        </div>
        <fieldset>
          <legend className="label">Visibility</legend>
          <div className="flex gap-4 text-sm">
            {(["public", "private"] as const).map((v) => (
              <label key={v} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                />
                {v === "public" ? "Public" : "Private — only you"}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save results"}
      </button>
    </form>
  );
}
