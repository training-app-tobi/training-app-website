"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import { SubmitButton } from "@/components/form-controls";
import { FormMessage } from "@/components/ui";

export function ProfileForm({
  profile,
}: {
  profile: { username: string; display_name: string | null; bodyweight_kg: number | null };
}) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <input
          className="input"
          id="username"
          name="username"
          required
          pattern="[A-Za-z0-9_]{3,24}"
          title="3–24 letters, numbers or underscores"
          defaultValue={profile.username}
        />
      </div>
      <div>
        <label className="label" htmlFor="display_name">
          Display name
        </label>
        <input
          className="input"
          id="display_name"
          name="display_name"
          maxLength={60}
          defaultValue={profile.display_name ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="bodyweight_kg">
          Bodyweight (kg)
        </label>
        <input
          className="input"
          id="bodyweight_kg"
          name="bodyweight_kg"
          type="number"
          step="0.1"
          min={20}
          max={250}
          defaultValue={profile.bodyweight_kg ?? ""}
        />
        <p className="mt-1 text-xs text-stone-500">
          Pre-fills test results so strength can be shown relative to bodyweight.
        </p>
      </div>
      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
