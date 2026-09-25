import { expect, test } from "@playwright/test";
import { authLinkFromEmail, signIn, signOut, signUpAndConfirm } from "./helpers";

// One story, two climbers: A builds, schedules and logs; B sees only A's public data,
// copies A's plan, and resets their password.
test.describe.configure({ mode: "serial" });

const run = Date.now().toString(36);
const alice = { email: `alice-${run}@example.test`, username: `alice_${run}`, password: "alice-password-1" };
const bob = { email: `bob-${run}@example.test`, username: `bob_${run}`, password: "bob-password-1" };
const planTitle = `E2E cycle ${run}`;

let planUrl = "";
let privateLogUrl = "";

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page).toHaveURL(/\/login\?next=%2Fcalendar$/);
});

test("A signs up, builds a two-block plan and schedules it", async ({ page }) => {
  await signUpAndConfirm(page, alice);

  await page.goto("/plans/new");
  await page.getByLabel("Title").fill(planTitle);
  await page.getByLabel("Goal").fill("Get stronger");
  await page.getByRole("button", { name: "Create and add blocks" }).click();
  await expect(page).toHaveURL(/\/plans\/[0-9a-f-]+\/edit$/);
  planUrl = page.url().replace(/\/edit$/, "");

  // Block 1: one training day with max hangs.
  await page.getByRole("button", { name: "+ Add block" }).click();
  const block1 = page.getByRole("region", { name: "Block 1" });
  await block1.getByLabel("Block 1 name").fill("Strength");
  await block1.getByRole("button", { name: "+ Training day" }).click();
  await block1.getByLabel("Session title").fill("Hangboard");
  await block1.getByRole("button", { name: "+ Exercise" }).click();
  await block1.getByLabel("Exercise or test").selectOption({ label: "Max hangs" });
  await block1.getByLabel("Sets").fill("5");
  await block1.getByLabel("Edge (mm)").fill("20");

  // Block 2: a test week.
  await page.getByRole("button", { name: "+ Add block" }).click();
  const block2 = page.getByRole("region", { name: "Block 2" });
  await block2.getByLabel("Block 2 name").fill("Test week");
  await block2.getByRole("button", { name: "+ Test day" }).click();
  await block2.getByLabel("Exercise or test").selectOption({ label: "Max pull-ups" });

  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(page.getByText("Plan saved.")).toBeVisible();

  await page.goto(planUrl);
  await expect(page.getByText("5 sets · 20 mm")).toBeVisible();
  await page.getByRole("link", { name: "Schedule" }).click();
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page).toHaveURL(/\/calendar\?month=\d{4}-\d{2}$/);
  await expect(page.locator("[data-kind=planned]", { hasText: "Hangboard" }).first()).toBeVisible();
});

test("sign-up rejects a username that is already taken", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(`taken-${run}@example.test`);
  await page.getByLabel("Username").fill(alice.username.toUpperCase());
  await page.getByLabel("Password").fill("some-password-1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("That username is taken")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(`taken-${run}@example.test`);
});

test("A logs the planned session, a test result and a private session", async ({ page }) => {
  await signIn(page, alice.email, alice.password);

  await page.goto("/plans");
  await page.getByRole("link", { name: "View" }).first().click();
  await page.locator("[data-kind=planned]", { hasText: "Hangboard" }).first().click();
  await expect(page).toHaveURL(/\/logs\/new\?session=/);
  await expect(page.getByText("Logging planned session")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Hangboard");
  await page.getByLabel("RPE").selectOption("8");
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(/\/logs\/[0-9a-f-]+$/);
  await expect(page.getByText("Max hangs")).toBeVisible();

  await page.goto("/tests/new");
  await page.getByLabel("Test", { exact: true }).selectOption({ label: "Max pull-ups" });
  await page.getByLabel("Repetitions").fill("12");
  await page.getByRole("button", { name: "Save results" }).click();
  await expect(page).toHaveURL(/\/tests$/);
  await expect(page.getByRole("region", { name: "Max pull-ups" }).getByText("12 reps").first()).toBeVisible();

  await page.goto("/logs/new");
  await page.getByLabel("Title").fill(`Secret session ${run}`);
  await page.getByLabel("Private — only you").check();
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page).toHaveURL(/\/logs\/[0-9a-f-]+$/);
  privateLogUrl = page.url();
  await signOut(page);
});

test("B sees A's public activity but not A's private log", async ({ page }) => {
  await signUpAndConfirm(page, bob);

  await page.goto("/explore");
  await expect(page.getByText(`Max pull-ups`).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Hangboard" }).first()).toBeVisible();
  await expect(page.getByText(`Secret session ${run}`)).toHaveCount(0);

  await page.goto(`/u/${alice.username}?tab=logs`);
  await expect(page.getByText("Hangboard")).toBeVisible();
  await expect(page.getByText(`Secret session ${run}`)).toHaveCount(0);

  const response = await page.goto(privateLogUrl);
  expect(response?.status()).toBe(404);
});

test("B copies A's plan and schedules it", async ({ page }) => {
  await signIn(page, bob.email, bob.password);
  await page.goto(planUrl);
  await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
  await page.getByRole("button", { name: "Copy & schedule" }).click();
  await expect(page.getByText("Copied to your plans")).toBeVisible();
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.locator("[data-kind=planned]", { hasText: "Hangboard" }).first()).toBeVisible();

  await page.goto("/plans");
  await expect(page.getByText(planTitle).first()).toBeVisible();
  await expect(page.getByText("copied").first()).toBeVisible();
});

test("B resets a forgotten password", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(bob.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("If an account exists")).toBeVisible();

  const link = await authLinkFromEmail(bob.email, /reset/i);
  await page.goto(link);
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel("New password", { exact: true }).fill("bob-new-password-2");
  await page.getByLabel("Confirm new password").fill("bob-new-password-2");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await signOut(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill(bob.email);
  await page.getByLabel("Password").fill(bob.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await signIn(page, bob.email, "bob-new-password-2");
});
