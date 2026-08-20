# Schedulein

Personal schedule and finance tracker. Daily and recurring schedules with Indonesian holiday awareness, income/expense tracking with category breakdowns, CSV/TXT export, and browser + optional email reminders.

## Features

- **Schedule**: daily entries, recurring weekly patterns (pick days directly), day/week views, search, bulk delete, edit in place, holiday-aware (country + configurable weekend days)
- **Finance**: income/expense tracking by category, edit in place, overspending alerts, CSV/TXT export (this month, custom date range), auto-export at month start
- **Auth**: register/login, forgot-password email flow
- **Notifications**: browser reminders before each schedule item, optional email reminders (requires a Resend API key)
- **Settings**: timezone, currency, country/holiday calendar, weekend days, notification preferences
- **Design**: brutalist UI — sharp corners, monospace metadata, a 4-tone green palette

## Quick Start (local, no setup)

The app runs out of the box in mock-auth mode — data is stored in your browser's localStorage, no Supabase project required.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and log in with the seeded test account: `test@example.com` / `password123`. Registering a new account also works, but only for the current browser session (see [SETUP.md](./SETUP.md) for why, and how to move to a real backend).

## Deploying for real use

Mock mode is per-browser only — it doesn't survive across devices and new registrations don't survive a hard refresh. For a real, persistent, multi-device deployment, follow **[SETUP.md](./SETUP.md)**: create a Supabase project, run `supabase/schema.sql`, set the environment variables, and deploy to Vercel.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Database/Auth**: Supabase (PostgreSQL + Auth), with a localStorage-backed mock client for local dev without credentials
- **Dates**: date-fns
- **Email** (optional): Resend, via `app/api/send-notification`

## Project Structure

```
schedulein/
├── app/
│   ├── jadwal/            # Schedule page (daily + recurring + week view)
│   ├── keuangan/          # Finance page
│   ├── settings/          # Settings page
│   ├── login/, register/  # Auth pages
│   ├── api/send-notification/  # Optional email reminder endpoint
│   ├── layout.tsx
│   └── page.tsx           # Redirects to /jadwal or /login
├── components/            # Navbar, Toast
├── lib/
│   ├── supabase.ts        # Real Supabase client, or a localStorage-backed mock
│   ├── recurring-schedule.ts
│   ├── indonesian-holidays.ts
│   ├── notifications.ts
│   └── export.ts
├── supabase/schema.sql    # Tables + RLS policies for a real deployment
├── proxy.ts               # Auth gate (Next.js proxy, formerly middleware.ts)
└── SETUP.md               # Full deployment guide
```

## Development

```bash
npm run dev     # start dev server
npm run build   # production build
npm start       # run the production build
npm run lint    # eslint
```
