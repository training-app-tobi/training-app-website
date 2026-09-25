import Link from "next/link";
import { signOut } from "@/actions/auth";
import { NavLinks } from "@/components/nav-links";
import { getMyProfile } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getMyProfile();
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-black tracking-tight text-stone-900">
              Crux<span className="text-accent-600">.</span>
            </Link>
            <div className="flex items-center gap-1 sm:hidden">
              <AccountLinks username={profile?.username} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <NavLinks />
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <AccountLinks username={profile?.username} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}

function AccountLinks({ username }: { username?: string }) {
  return (
    <>
      {username && (
        <Link href={`/u/${username}`} className="btn-ghost px-2 py-1 text-sm">
          @{username}
        </Link>
      )}
      <Link href="/settings" className="btn-ghost px-2 py-1 text-sm">
        Settings
      </Link>
      <form action={signOut}>
        <button type="submit" className="btn-ghost px-2 py-1 text-sm">
          Sign out
        </button>
      </form>
    </>
  );
}
