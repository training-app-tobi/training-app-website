import { expect, type Page } from "@playwright/test";

// Supabase CLI serves Mailpit on 54324 by default.
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

type MailpitList = { messages: { ID: string; Subject: string; To: { Address: string }[] }[] };

/** Waits for the newest email to `to` whose subject matches, and returns the /auth/confirm link in it. */
export async function authLinkFromEmail(to: string, subject: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const list = (await res.json()) as MailpitList;
    const message = list.messages.find((m) => subject.test(m.Subject));
    if (message) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as { HTML: string };
      const href = full.HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email matching ${subject} for ${to}`);
}

export async function signUpAndConfirm(page: Page, user: { email: string; username: string; password: string }) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  const link = await authLinkFromEmail(user.email, /confirm/i);
  await page.goto(link);
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
