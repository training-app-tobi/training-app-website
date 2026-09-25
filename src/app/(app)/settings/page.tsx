import type { Metadata } from "next";
import { signOut } from "@/actions/auth";
import { NewPasswordForm } from "@/components/auth-forms";
import { SubmitButton } from "@/components/form-controls";
import { ProfileForm } from "@/components/settings-forms";
import { PageHeader } from "@/components/ui";
import { getMyProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getMyProfile();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 font-semibold">Profile</h2>
          {profile && (
            <ProfileForm
              profile={{
                ...profile,
                bodyweight_kg: profile.bodyweight_kg === null ? null : Number(profile.bodyweight_kg),
              }}
            />
          )}
        </section>
        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-4 font-semibold">Change password</h2>
            <NewPasswordForm />
          </section>
          <section className="card">
            <h2 className="mb-1 font-semibold">Sessions</h2>
            <p className="mb-4 text-sm text-stone-600">Signed in on a shared or lost device? Sign out everywhere.</p>
            <form action={signOut}>
              <input type="hidden" name="scope" value="global" />
              <SubmitButton className="btn-danger" pendingText="Signing out…">
                Sign out of all devices
              </SubmitButton>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
