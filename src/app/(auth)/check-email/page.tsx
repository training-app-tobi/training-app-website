import type { Metadata } from "next";
import Link from "next/link";
import { ResendConfirmationForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Check your email" };

export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const { email } = await searchParams;
  const address = typeof email === "string" ? email : "";
  return (
    <>
      <h1 className="mb-2 text-lg font-semibold">Check your email</h1>
      <p className="mb-4 text-sm text-stone-600">
        We sent a confirmation link
        {address && (
          <>
            {" "}
            to <strong className="break-all">{address}</strong>
          </>
        )}
        . Open it to activate your account.
      </p>
      {address && <ResendConfirmationForm email={address} />}
      <p className="mt-6 text-center text-sm text-stone-600">
        <Link href="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
