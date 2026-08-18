# Deployment Guide

This app runs in one of two modes, controlled by `NEXT_PUBLIC_MOCK_AUTH` in `.env.local`:

- **Mock mode** (`true`, the current default): no backend needed. Auth and data live in the browser (localStorage). Good for trying the app locally, not for real use across devices.
- **Real mode** (`false`): a real Supabase project handles auth and stores data in Postgres. This is what you want before deploying somewhere you'll actually use day to day.

This guide gets you from mock mode to a deployed, real-mode app on Vercel.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New Project** → give it a name, set a database password (save it somewhere), pick a region close to you.
3. Wait for provisioning (a couple of minutes).

## 2. Create the database tables

1. In the Supabase dashboard, open **SQL Editor** → **New Query**.
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) from this repo and run it.

This creates `schedule_items`, `recurring_schedules`, and `transactions`, each with Row Level Security enabled so every user only ever sees their own rows. The `user_id` column defaults to `auth.uid()`, so the app never needs to set it explicitly on insert — Postgres fills it in from the logged-in session automatically.

Safe to re-run if you need to; it uses `if not exists` / `drop policy if exists` throughout.

## 3. Get your API credentials

In the Supabase dashboard: **Settings → API**. You need:

- **Project URL**
- **anon public** key

## 4. Set environment variables

Update `.env.local` for local testing against the real backend:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MOCK_AUTH=false
```

Optional, only if you want email reminders (Settings → "Also send email reminders"):

```
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=Schedulein <onboarding@resend.dev>
```

Get a free key at [resend.com](https://resend.com). Without this, email reminders silently do nothing — browser notifications still work regardless.

Run `npm run dev` and confirm you can register and log in for real (check **Authentication → Users** in the Supabase dashboard to see the new account).

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com): **Add New → Project** → import the repo.
3. Under **Environment Variables**, add the same variables from step 4 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MOCK_AUTH=false`, and `RESEND_API_KEY`/`RESEND_FROM_EMAIL` if using email).
4. **Deploy**.

Vercel gives you a public URL once the build finishes.

## Post-deploy checklist

- Register an account on the deployed URL and confirm it appears in Supabase's **Authentication → Users**.
- Add a schedule item and a recurring schedule, refresh the page, confirm both are still there (this is exactly the bug real-mode fixes over mock mode).
- Add a transaction and confirm the summary cards update.
- If you enabled it, test email reminders: set a schedule a couple of minutes out with a short notify-before window in Settings.

## Troubleshooting

**"Invalid login credentials" on login**
The account either doesn't exist yet in this Supabase project, or the password is wrong. Register first, or check **Authentication → Users** in the dashboard.

**Data not showing up**
Check the tables directly in Supabase: **Table Editor**, or run in **SQL Editor**:
```sql
select * from schedule_items;
select * from recurring_schedules;
select * from transactions;
```
If a table is empty but you're sure you added data, check `NEXT_PUBLIC_MOCK_AUTH` is actually `false` in the environment the app is running in — mock mode writes to the browser's localStorage instead, not to Supabase.

**Email reminders aren't arriving**
`RESEND_API_KEY` is likely not set in the deployment's environment variables — the API route returns a clear "not configured" error instead of silently failing; check the Vercel function logs for `/api/send-notification`.
