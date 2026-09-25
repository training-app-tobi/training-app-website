"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

/** A form button that asks for confirmation before running a (bound) server action. */
export function ConfirmButton({
  action,
  children,
  confirm,
  className = "btn-danger",
}: {
  action: () => Promise<void>;
  children: ReactNode;
  confirm: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <SubmitButton className={className} pendingText="Working…">
        {children}
      </SubmitButton>
    </form>
  );
}
