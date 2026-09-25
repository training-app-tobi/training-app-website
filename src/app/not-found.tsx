import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="text-sm font-semibold text-accent-700">404</p>
      <h1 className="text-2xl font-bold">Not found</h1>
      <p className="max-w-md text-stone-600">This page doesn&apos;t exist, or it&apos;s private.</p>
      <Link href="/dashboard" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </main>
  );
}
