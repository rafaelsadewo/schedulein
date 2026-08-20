-- Schedulein database schema
-- Run this once in your Supabase project's SQL Editor before deploying with
-- NEXT_PUBLIC_MOCK_AUTH=false. Safe to re-run (uses IF NOT EXISTS throughout).
--
-- All tables use `user_id uuid default auth.uid()` so the app never needs to
-- pass a user id on insert - Postgres fills it in from the authenticated
-- session automatically. Row Level Security then makes sure every user only
-- ever sees their own rows.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- schedule_items: single-date schedule entries
-- ---------------------------------------------------------------------------
create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  date text not null,
  start_time text not null,
  end_time text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table schedule_items enable row level security;

drop policy if exists "schedule_items_select_own" on schedule_items;
create policy "schedule_items_select_own" on schedule_items
  for select using (auth.uid() = user_id);

drop policy if exists "schedule_items_insert_own" on schedule_items;
create policy "schedule_items_insert_own" on schedule_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "schedule_items_update_own" on schedule_items;
create policy "schedule_items_update_own" on schedule_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "schedule_items_delete_own" on schedule_items;
create policy "schedule_items_delete_own" on schedule_items
  for delete using (auth.uid() = user_id);

create index if not exists schedule_items_user_date_idx on schedule_items (user_id, date);

-- ---------------------------------------------------------------------------
-- recurring_schedules: weekly recurrence pattern definitions
-- ---------------------------------------------------------------------------
create table if not exists recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  start_time text not null,
  end_time text not null,
  recurrence_type text not null default 'weekly',
  days_of_week integer[] not null default '{}',
  end_date text,
  notes text,
  created_at timestamptz not null default now()
);

alter table recurring_schedules enable row level security;

drop policy if exists "recurring_schedules_select_own" on recurring_schedules;
create policy "recurring_schedules_select_own" on recurring_schedules
  for select using (auth.uid() = user_id);

drop policy if exists "recurring_schedules_insert_own" on recurring_schedules;
create policy "recurring_schedules_insert_own" on recurring_schedules
  for insert with check (auth.uid() = user_id);

drop policy if exists "recurring_schedules_update_own" on recurring_schedules;
create policy "recurring_schedules_update_own" on recurring_schedules
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recurring_schedules_delete_own" on recurring_schedules;
create policy "recurring_schedules_delete_own" on recurring_schedules
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions: income / expense entries
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric not null check (amount > 0),
  description text,
  date text not null,
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;

drop policy if exists "transactions_select_own" on transactions;
create policy "transactions_select_own" on transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on transactions;
create policy "transactions_insert_own" on transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on transactions;
create policy "transactions_update_own" on transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on transactions;
create policy "transactions_delete_own" on transactions
  for delete using (auth.uid() = user_id);

create index if not exists transactions_user_date_idx on transactions (user_id, date);
