import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-black tracking-tight text-stone-900">
        Crux<span className="text-accent-600">.</span>
      </Link>
      <div className="card w-full max-w-sm">{children}</div>
    </main>
  );
}
