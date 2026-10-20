-- Run once in the Bling Beauty Supabase SQL Editor.
create table if not exists public.store_settings (
  id integer primary key check (id = 1),
  orders_suspended boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;
-- No anon/authenticated policies: only server-side service-role access.
insert into public.store_settings (id, orders_suspended)
values (1, true) on conflict (id) do nothing;
