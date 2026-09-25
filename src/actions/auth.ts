"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { authErrorMessage } from "@/lib/errors";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, firstError, newPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = {
    email: text(formData, "email"),
    username: text(formData, "username"),
    display_name: text(formData, "display_name"),
  };
  const parsed = signUpSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { error: firstError(parsed.error), values };
  const { email, password, username, display_name } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.siteUrl}/auth/confirm?next=/dashboard`,
      data: { username, display_name },
    },
  });
  // The profile trigger rejects taken usernames; Auth reports it as a database error.
  if (error && /username already taken|database error saving new user/i.test(error.message)) {
    return { error: "That username is taken. Please choose another.", values };
  }
  if (error) return { error: authErrorMessage(error), values };

  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = { email: text(formData, "email") };
  const parsed = signInSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { error: firstError(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error), values };

  redirect(safeNext(formData.get("next")));
}

export async function resendConfirmation(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${env.siteUrl}/auth/confirm?next=/dashboard` },
  });
  if (error) return { error: authErrorMessage(error) };
  return { ok: "If that address is waiting for confirmation, we've sent a new link." };
}

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  const values = { email: text(formData, "email") };
  const parsed = emailSchema.safeParse(values);
  if (!parsed.success) return { error: firstError(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl}/auth/confirm?next=/reset-password`,
  });
  // Same answer whether or not the account exists, so emails can't be probed.
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) {
    return { error: authErrorMessage(error), values };
  }
  return { ok: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsed = newPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirm: text(formData, "confirm"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };

  const next = formData.get("next");
  if (next) redirect(safeNext(next));
  return { ok: "Password updated." };
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  const scope = formData.get("scope") === "global" ? "global" : "local";
  await supabase.auth.signOut({ scope });
  redirect("/login");
}
