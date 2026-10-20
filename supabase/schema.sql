create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null check (category in ('Cosmetics', 'Aesthetic Enhancements')),
  price_gbp numeric not null default 0,
  short text not null,
  description text not null,
  highlights text[] not null default '{}',
  images text[] not null default '{}',
  badge text null check (badge in ('Best Seller', 'New', 'Limited')),
  stripe_price_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "public read active products"
on public.products for select
using (is_active = true);
