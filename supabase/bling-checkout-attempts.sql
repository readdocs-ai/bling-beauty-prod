-- Run in Supabase SQL Editor before enabling checkout; never expose these records to anon users.
create table if not exists public.bling_checkout_attempts (
  reference text primary key,
  status text not null default 'pending',
  amount_pence integer not null check (amount_pence > 0),
  currency text not null default 'GBP',
  items jsonb not null,
  customer jsonb not null,
  shipping jsonb not null,
  query_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bling_checkout_attempts enable row level security;
-- No anon/authenticated policies: service role access only.
-- Additive columns for server-side verification.
alter table public.bling_checkout_attempts add column if not exists provider_payment_id text;
create unique index if not exists bling_checkout_payment_unique on public.bling_checkout_attempts(provider_payment_id) where provider_payment_id is not null;
