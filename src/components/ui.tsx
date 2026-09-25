import Link from "next/link";
import type { ReactNode } from "react";
import type { Visibility } from "@/lib/types";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {description && <div className="mt-1 text-sm text-stone-600">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white/60 px-4 py-8 text-center text-sm text-stone-600">
      <p>{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return visibility === "private" ? (
    <span className="inline-flex items-center rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
      Private
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Public
    </span>
  );
}

export function Badge({ children, tone = "stone" }: { children: ReactNode; tone?: "stone" | "accent" | "blue" }) {
  const tones = {
    stone: "bg-stone-100 text-stone-700",
    accent: "bg-accent-100 text-accent-700",
    blue: "bg-sky-100 text-sky-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
      >
        {state.ok}
      </p>
    );
  return null;
}

export function UserLink({ profile }: { profile: { username: string; display_name: string | null } | null }) {
  if (!profile) return <span>Unknown climber</span>;
  return (
    <Link href={`/u/${profile.username}`} className="link">
      {profile.display_name || `@${profile.username}`}
    </Link>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="card">
      <div className="text-xs font-medium tracking-wide text-stone-500 uppercase">{label}</div>
      <div className="mt-1 text-xl font-semibold text-stone-900">{value}</div>
    </div>
  );
}
