"use client";

import { useActionState } from "react";
import { createPlan } from "@/actions/plans";
import { schedulePlan } from "@/actions/schedule";
import { SubmitButton } from "@/components/form-controls";
import { FormMessage } from "@/components/ui";
import { formatDate } from "@/lib/dates";

export function NewPlanForm() {
  const [state, action] = useActionState(createPlan, undefined);
  return (
    <form action={action} className="card max-w-2xl space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          className="input"
          id="title"
          name="title"
          required
          maxLength={120}
          placeholder="e.g. Winter bouldering cycle"
          defaultValue={state?.values?.title}
        />
      </div>
      <div>
        <label className="label" htmlFor="goal">
          Goal <span className="text-stone-400">(optional)</span>
        </label>
        <input
          className="input"
          id="goal"
          name="goal"
          maxLength={300}
          placeholder="e.g. Send my first 7A"
          defaultValue={state?.values?.goal}
        />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description <span className="text-stone-400">(optional)</span>
        </label>
        <textarea
          className="input"
          id="description"
          name="description"
          rows={3}
          maxLength={5000}
          defaultValue={state?.values?.description}
        />
      </div>
      <VisibilityField defaultValue={state?.values?.visibility} />
      <SubmitButton pendingText="Creating…">Create and add blocks</SubmitButton>
    </form>
  );
}

export function VisibilityField({
  defaultValue = "public",
  name = "visibility",
}: {
  defaultValue?: string;
  name?: string;
}) {
  return (
    <fieldset>
      <legend className="label">Visibility</legend>
      <div className="flex gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name={name} value="public" defaultChecked={defaultValue !== "private"} />
          Public — other climbers can see it
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name={name} value="private" defaultChecked={defaultValue === "private"} />
          Private — only you
        </label>
      </div>
    </fieldset>
  );
}

export function ScheduleForm({ planId, mondays }: { planId: string; mondays: string[] }) {
  const [state, action] = useActionState(schedulePlan, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="plan_id" value={planId} />
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="start_date">
          Start on Monday
        </label>
        <select className="input max-w-xs" id="start_date" name="start_date" defaultValue={mondays[1] ?? mondays[0]}>
          {mondays.map((m, i) => (
            <option key={m} value={m}>
              {formatDate(m, "EEE d MMM yyyy")}
              {i === 0 ? " (this week)" : i === 1 ? " (next week)" : ""}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton pendingText="Scheduling…">Add to my calendar</SubmitButton>
    </form>
  );
}
