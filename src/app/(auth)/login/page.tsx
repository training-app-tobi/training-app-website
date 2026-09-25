import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  link: "That link is invalid or has expired. Request a new one.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const message = typeof error === "string" ? errors[error] : undefined;
  return (
    <>
      <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
      {message && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {message}
        </p>
      )}
      <LoginForm next={safeNext(next)} />
      <p className="mt-6 text-center text-sm text-stone-600">
        New here?{" "}
        <Link href="/register" className="link">
          Create an account
        </Link>
      </p>
    </>
  );
}
