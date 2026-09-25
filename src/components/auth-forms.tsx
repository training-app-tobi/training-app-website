"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, resendConfirmation, signIn, signUp, updatePassword } from "@/actions/auth";
import { SubmitButton } from "@/components/form-controls";
import { FormMessage } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email}
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="password">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs link">
            Forgot password?
          </Link>
        </div>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(signUp, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email}
        />
      </div>
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <input
          className="input"
          id="username"
          name="username"
          autoComplete="username"
          required
          pattern="[A-Za-z0-9_]{3,24}"
          title="3–24 letters, numbers or underscores"
          defaultValue={state?.values?.username}
        />
        <p className="mt-1 text-xs text-stone-500">Shown on your public profile, e.g. /u/your_name.</p>
      </div>
      <div>
        <label className="label" htmlFor="display_name">
          Display name <span className="text-stone-400">(optional)</span>
        </label>
        <input
          className="input"
          id="display_name"
          name="display_name"
          maxLength={60}
          defaultValue={state?.values?.display_name}
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          required
        />
        <p className="mt-1 text-xs text-stone-500">At least 10 characters. A passphrase works well.</p>
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email}
        />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResendConfirmationForm({ email }: { email: string }) {
  const [state, action] = useActionState(resendConfirmation, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      <FormMessage state={state} />
      <SubmitButton className="btn-secondary w-full" pendingText="Sending…">
        Resend confirmation email
      </SubmitButton>
    </form>
  );
}

export function NewPasswordForm({ next }: { next?: string }) {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="password">
          New password
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm new password
        </label>
        <input
          className="input"
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          required
        />
      </div>
      <SubmitButton pendingText="Saving…">Update password</SubmitButton>
    </form>
  );
}
