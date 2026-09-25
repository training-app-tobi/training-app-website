"use client";

import { useActionState } from "react";
import { createExercise, createTestType } from "@/actions/exercises";
import { SubmitButton } from "@/components/form-controls";
import { FormMessage } from "@/components/ui";
import { EXERCISE_CATEGORIES, TEST_CATEGORIES, TEST_UNITS } from "@/lib/types";

export function NewExerciseForm() {
  const [state, action] = useActionState(createExercise, undefined);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="ex-name">
          Name
        </label>
        <input
          id="ex-name"
          name="name"
          className="input"
          required
          maxLength={80}
          placeholder="e.g. Pinch block lifts"
        />
      </div>
      <div>
        <label className="label" htmlFor="ex-category">
          Category
        </label>
        <select id="ex-category" name="category" className="input" defaultValue="finger_strength">
          {EXERCISE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="ex-description">
          Description
        </label>
        <textarea id="ex-description" name="description" className="input" rows={2} maxLength={2000} />
      </div>
      <SubmitButton pendingText="Adding…">Add exercise</SubmitButton>
    </form>
  );
}

export function NewTestTypeForm() {
  const [state, action] = useActionState(createTestType, undefined);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="tt-name">
          Name
        </label>
        <input
          id="tt-name"
          name="name"
          className="input"
          required
          maxLength={80}
          placeholder="e.g. Max hang 15 mm / 7 s"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tt-category">
            Category
          </label>
          <select id="tt-category" name="category" className="input" defaultValue="finger">
            {TEST_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tt-unit">
            Measured in
          </label>
          <select id="tt-unit" name="unit" className="input" defaultValue="kg_added">
            {TEST_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="tt-direction">
          Better result is
        </label>
        <select id="tt-direction" name="higher_is_better" className="input" defaultValue="true">
          <option value="true">Higher</option>
          <option value="false">Lower (e.g. smaller edge)</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="tt-protocol">
          Protocol
        </label>
        <textarea
          id="tt-protocol"
          name="protocol"
          className="input"
          rows={2}
          maxLength={2000}
          placeholder="How to run the test so results are comparable"
        />
      </div>
      <SubmitButton pendingText="Adding…">Add test</SubmitButton>
    </form>
  );
}
