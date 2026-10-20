-- Run after bling-checkout-attempts.sql. Private tables; no client policies.
create table if not exists public.bling_paid_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique references public.bling_checkout_attempts(reference),
  provider_payment_id text not null unique,
  status text not null default 'paid' check (status = 'paid'),
  amount_pence integer not null,
  currency text not null default 'GBP',
  items jsonb not null, customer jsonb not null, shipping jsonb not null,
  verified_at timestamptz not null default now(),
  email_customer_status text not null default 'pending',
  email_admin_status text not null default 'pending',
  royal_mail_status text not null default 'awaiting_measured_weight',
  parcel_weight_grams integer,
  royal_mail_order_id text,
  created_at timestamptz not null default now()
);
alter table public.bling_paid_orders enable row level security;
create table if not exists public.bling_paid_order_jobs (
  order_id uuid not null references public.bling_paid_orders(id),
  kind text not null check (kind in ('customer_email','admin_email','royal_mail')),
  status text not null default 'pending',
  claimed_at timestamptz,
  completed_at timestamptz,
  provider_id text,
  last_error text,
  primary key (order_id, kind)
);
alter table public.bling_paid_order_jobs enable row level security;
create or replace function public.bling_finalise_verified_payment(p_reference text, p_payment_id text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare a public.bling_checkout_attempts%rowtype; oid uuid;
begin
  if p_payment_id is null or length(trim(p_payment_id)) < 3 then raise exception 'Invalid payment id'; end if;
  select * into a from public.bling_checkout_attempts where reference = p_reference for update;
  if not found or a.status not in ('pending','redirected','paid_verified') then raise exception 'Invalid checkout state'; end if;
  if a.provider_payment_id is not null and a.provider_payment_id <> p_payment_id then raise exception 'Payment mismatch'; end if;
  insert into public.bling_paid_orders(reference,provider_payment_id,amount_pence,currency,items,customer,shipping)
    values (a.reference,p_payment_id,a.amount_pence,a.currency,a.items,a.customer,a.shipping)
    on conflict (reference) do nothing returning id into oid;
  if oid is null then
    select id into oid from public.bling_paid_orders where reference = p_reference and provider_payment_id = p_payment_id;
    if oid is null then raise exception 'Existing order payment mismatch'; end if;
  end if;
  update public.bling_checkout_attempts set status='paid_verified',provider_payment_id=p_payment_id,updated_at=now() where reference=p_reference;
  insert into public.bling_paid_order_jobs(order_id,kind) values (oid,'customer_email'),(oid,'admin_email'),(oid,'royal_mail') on conflict do nothing;
  return oid;
end $$;
revoke all on function public.bling_finalise_verified_payment(text,text) from public, anon, authenticated;
grant execute on function public.bling_finalise_verified_payment(text,text) to service_role;
-- Royal Mail preparation remains queued until the packed parcel has a measured weight.
-- The website must never invent a weight or purchase a postage label during testing.
