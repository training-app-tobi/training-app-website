# Crux — climbing training plans

A web app for climbers to build block-based training plans, follow them on a calendar, log sessions and
climbing tests, and learn from what other climbers share.

- **Plans**: plan → blocks (e.g. Base, Strength, Power) → weeks → days → exercises. A day can be a
  **test day**. Duplicate weeks, reorder blocks, mix built-in and custom exercises.
- **Schedule**: put a plan on your calendar from any Monday. Planned sessions, logged sessions and test
  results all show on one month view.
- **Log**: record what you did, pre-filled from the planned session, with RPE, duration and notes.
- **Tests**: finger strength (max hang, min edge), pulling strength (1RM, max pull-ups, lock-off) and
  grade benchmarks (Font / French), with best result, latest vs previous and a trend line.
- **Exercise library**: ~30 built-in exercises and 7 built-in tests, plus your own custom ones.
- **Community**: everything is public by default with a per-item private toggle. Browse other climbers'
  plans, sessions, tests and calendars; **copy & schedule** any public plan.

Units are metric (kg, mm); grades use Font (boulders) and French (routes).

## Architecture and security

| Concern                                                                                  | Handled by                                                        |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Passwords, sessions, token refresh, email confirmation, password reset, auth rate limits | **Supabase Auth**                                                 |
| Who can read or write each row                                                           | **Postgres Row Level Security** (`supabase/migrations/*_rls.sql`) |
| Multi-step writes (save plan tree, copy plan, schedule plan)                             | Postgres functions that run as the caller, so RLS still applies   |
| HTTPS, DDoS protection, secrets, preview protection, rate-limit rules                    | **Vercel**                                                        |
| UI, input validation (zod), calendar and grade logic                                     | This Next.js app                                                  |

- The app talks to Supabase **as the signed-in user** with the publishable (anon) key. There is no
  service-role key in the app, so a bug in app code cannot bypass RLS.
- Signed-out visitors (`anon`) have no access to any table. Signed-in users can read public rows and
  their own private rows, and can only write their own rows. Privileges are granted column by column,
  so users cannot set fields like `owner_id` or `is_built_in` even through the raw API.
- Composite foreign keys keep every child row (weeks, days, items, logs linked to planned sessions)
  inside its parent's plan and owner.
- The server verifies the user with `supabase.auth.getClaims()` (never trusts the cookie alone), and
  `?next=` redirects only accept same-site paths.
- Accounts require email confirmation; passwords need at least 10 characters.

Database tests in `supabase/tests/database/` check these rules (e.g. user B cannot read, change or
copy user A's private data; anon reads nothing).

## Local development

Prerequisites: Node.js 22+, Docker (for the local Supabase stack).

```bash
npm install
npm run db:start          # starts Postgres, Auth, API and Mailpit locally; applies migrations + seed
npx supabase status -o env
```

Create `.env.local` from `.env.example`, using `API_URL` and the publishable/anon key printed by
`supabase status`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable or anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
npm run dev               # http://localhost:3000
```

Demo accounts from `supabase/seed.sql` (local only), password `climbing-demo-1`:
`alex@example.com` (has a scheduled plan, logs and tests) and `sam@example.com`.

Emails (sign-up confirmation, password reset) are caught by Mailpit at http://127.0.0.1:54324.

### Scripts

| Script                            | What it does                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server                                                                       |
| `npm run lint` / `typecheck`      | ESLint / TypeScript                                                                                                             |
| `npm test`                        | Unit tests (Vitest)                                                                                                             |
| `npm run test:e2e`                | End-to-end tests (Playwright). Needs the local Supabase stack and `.env.local`; starts `npm run dev` if nothing is on port 3000 |
| `npm run db:reset`                | Re-create the local database from migrations + seed                                                                             |
| `npm run db:test`                 | Database tests (pgTAP): RLS and database functions                                                                              |
| `npm run db:lint`                 | Lint SQL functions                                                                                                              |
| `npm run db:types`                | Regenerate `src/lib/database.types.ts` after a schema change                                                                    |

## Deploying (Supabase + Vercel)

1. **Supabase project**: create a project at supabase.com.
2. **Schema**: `npx supabase link --project-ref <ref>` then `npx supabase db push`. This applies the
   migrations, including the built-in exercise/test catalog. (The demo seed is not applied.)
3. **Auth settings** (Dashboard → Authentication):
   - URL configuration: Site URL = your production URL; add redirect URLs for
     `https://<your-domain>/**` and, for previews, `https://*-<team>.vercel.app/**`.
   - Email: keep "Confirm email" on; minimum password length 10; enable leaked-password protection
     if your plan includes it.
   - Email templates: paste `supabase/templates/confirmation.html` and `recovery.html` into
     "Confirm signup" and "Reset password" (their links go to `/auth/confirm`).
   - SMTP: set up a custom SMTP provider (e.g. Resend). Supabase's built-in sender is only for testing
     and allows very few emails per hour.
   - Optionally enable CAPTCHA (Turnstile/hCaptcha) under Attack Protection.
4. **Data API**: keep it enabled (the app uses it). All tables are protected by RLS; check
   Dashboard → Advisors → Security Advisor shows no warnings.
5. **Vercel**: import the repository, then add the **Supabase integration** from the Vercel
   Marketplace so `NEXT_PUBLIC_SUPABASE_URL` and the publishable key (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   which the app also accepts) are set automatically. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
6. **Vercel protection**: add a Firewall rate-limit rule for `/login`, `/register` and
   `/forgot-password`, and enable Deployment Protection for preview deployments.

Email links always use the Site URL, so confirmation and reset emails from a preview deployment
open production.

## Project structure

```
src/
  app/                 Next.js routes: (auth) pages, (app) signed-in pages, auth/confirm handler
  actions/             Server actions (validate with zod, then call Supabase as the user)
  components/          UI: calendar, plan builder, log/test forms, test history, feed
  lib/                 Supabase clients, auth helpers, queries, validation, dates, grades, formatting
  proxy.ts             Refreshes the session cookie and redirects signed-out visitors
supabase/
  migrations/          Schema, RLS policies, database functions, built-in catalog
  tests/database/      pgTAP tests for RLS and functions
  templates/           Auth email templates
  seed.sql             Local demo data
e2e/                   Playwright end-to-end tests
```
