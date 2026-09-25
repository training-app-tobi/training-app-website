import Link from "next/link";
import { getUserId } from "@/lib/auth";

const FEATURES = [
  {
    title: "Block-based plans",
    body: "Structure training into blocks, weeks and days. Mix built-in exercises like max hangs and 4x4s with your own.",
  },
  {
    title: "Everything on one calendar",
    body: "Schedule a plan from any Monday. Planned sessions, logged sessions and test results show up side by side.",
  },
  {
    title: "Test at the end of each block",
    body: "Track max hangs, weighted pull-ups, lock-offs and your hardest sends to see if the block worked.",
  },
  {
    title: "Learn from other climbers",
    body: "Browse public plans, logs and tests. Copy a plan into your account and schedule it in two clicks.",
  },
];

export default async function Home() {
  const signedIn = Boolean(await getUserId());
  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <span className="text-xl font-black tracking-tight">
          Crux<span className="text-accent-600">.</span>
        </span>
        <nav className="flex gap-2">
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:pt-20">
        <p className="text-sm font-semibold tracking-wide text-accent-700 uppercase">Climbing training, planned</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-stone-900 sm:text-6xl">
          Plan the block. Log the session. Test the gains.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Crux is a training log for climbers: build periodized plans, follow them on a calendar, record what you
          actually did, and share it all with your crew.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={signedIn ? "/dashboard" : "/register"} className="btn-primary px-5 py-2.5 text-base">
            {signedIn ? "Go to your dashboard" : "Create a free account"}
          </Link>
          {!signedIn && (
            <Link href="/login" className="btn-secondary px-5 py-2.5 text-base">
              Sign in
            </Link>
          )}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h2 className="font-semibold text-stone-900">{f.title}</h2>
              <p className="mt-2 text-sm text-stone-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
