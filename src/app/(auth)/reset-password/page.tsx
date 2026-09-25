import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth-forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // Reached through the recovery email link, which signs the user in.
  await requireUser();
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">Choose a new password</h1>
      <NewPasswordForm next="/dashboard" />
    </>
  );
}
