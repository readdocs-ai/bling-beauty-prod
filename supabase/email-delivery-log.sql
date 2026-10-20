-- Apply after reviewing the current schema; no changes to existing orders.
-- Email sending is NOT enabled by this migration.
BEGIN;
CREATE TABLE IF NOT EXISTS public.order_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  email_kind text NOT NULL CHECK (email_kind IN ('payment-confirmed','admin-alert','dispatched')),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','sent','failed')),
  resend_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, email_kind)
);
ALTER TABLE public.order_email_deliveries ENABLE ROW LEVEL SECURITY;
-- Intentionally no anon/authenticated policies. Server service role only.
COMMIT;
