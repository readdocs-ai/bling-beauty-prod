-- Bling Beauty: additive Worldpay/order/shipping preparation.
-- Review in Supabase SQL Editor. Does not create payments, delete historical data,
-- or enable checkout. Run only after taking a database backup.
BEGIN;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- No public order policies are created. Access must remain server-side via service role.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_event_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfilment_status text NOT NULL DEFAULT 'awaiting_payment';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS royal_mail_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_items jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS bling_orders_provider_payment_unique
  ON public.orders (payment_provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bling_orders_provider_event_unique
  ON public.orders (payment_provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bling_orders_royal_mail_order_unique
  ON public.orders (royal_mail_order_id)
  WHERE royal_mail_order_id IS NOT NULL;
COMMIT;
