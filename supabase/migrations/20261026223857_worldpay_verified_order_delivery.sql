-- Preview preparation only. No existing attempt is assumed to be a Live or Try payment.
ALTER TABLE public.bling_checkout_attempts ADD COLUMN IF NOT EXISTS payment_environment text
 CHECK (payment_environment IN ('try','live'));
ALTER TABLE public.bling_paid_orders ADD COLUMN IF NOT EXISTS payment_environment text
 CHECK (payment_environment IN ('try','live'));
ALTER TABLE public.bling_paid_orders ADD COLUMN IF NOT EXISTS provider_event_id text;
CREATE TABLE public.bling_worldpay_settlement_events (
 environment text NOT NULL CHECK(environment IN ('try','live')),
 event_id text NOT NULL CHECK(length(event_id) BETWEEN 3 AND 128),
 reference text NOT NULL CHECK(reference ~ '^BLING-[0-9a-f-]{36}$'),
 amount_pence integer NOT NULL CHECK(amount_pence>0),
 event_timestamp timestamptz NOT NULL,
 body_sha256 text NOT NULL CHECK(body_sha256 ~ '^[a-f0-9]{64}$'),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processed')),
 order_id uuid REFERENCES public.bling_paid_orders(id),
 received_at timestamptz NOT NULL DEFAULT now(),processed_at timestamptz,
 PRIMARY KEY(environment,event_id)
);
CREATE INDEX bling_settlement_pending ON public.bling_worldpay_settlement_events(environment,received_at) WHERE status='pending';
ALTER TABLE public.bling_worldpay_settlement_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bling_worldpay_settlement_events FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.bling_worldpay_settlement_events TO service_role;

-- Called only after raw-body HMAC validation AND independent Worldpay payment matching.
-- Event receipt, payment state, order and durable jobs commit atomically.
CREATE OR REPLACE FUNCTION public.bling_commit_settled_event(
 p_environment text,p_event_id text,p_body_sha256 text,p_claim uuid,p_payment_id text
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE e public.bling_worldpay_settlement_events%rowtype;
 a public.bling_checkout_attempts%rowtype; oid uuid;
BEGIN
 SELECT * INTO e FROM public.bling_worldpay_settlement_events
 WHERE environment=p_environment AND event_id=p_event_id FOR UPDATE;
 IF NOT FOUND OR e.body_sha256 IS DISTINCT FROM p_body_sha256 THEN RAISE EXCEPTION 'Event mismatch';END IF;
 SELECT * INTO a FROM public.bling_checkout_attempts WHERE reference=e.reference FOR UPDATE;
 IF NOT FOUND OR a.payment_environment IS DISTINCT FROM p_environment OR
  a.payment_claim_id IS DISTINCT FROM p_claim OR p_claim IS NULL OR p_payment_id IS NULL OR
  a.provider_payment_id IS DISTINCT FROM p_payment_id OR a.amount_pence<>e.amount_pence OR a.currency<>'GBP' OR
  a.status NOT IN ('payment_processing','settlement_verified','paid_verified') THEN RAISE EXCEPTION 'Payment mismatch';END IF;
 IF e.status='processed' THEN RETURN e.order_id;END IF;
 IF a.status<>'paid_verified' THEN
  IF NOT public.bling_record_verified_settlement(a.reference,p_claim,p_payment_id,'settled') THEN
   RAISE EXCEPTION 'Settlement unavailable';END IF;
 END IF;
 oid:=public.bling_finalise_verified_payment(a.reference,p_payment_id);
 UPDATE public.bling_paid_orders SET payment_environment=p_environment,
  provider_event_id=coalesce(provider_event_id,p_event_id) WHERE id=oid
  AND (payment_environment IS NULL OR payment_environment=p_environment);
 IF NOT FOUND THEN RAISE EXCEPTION 'Order environment mismatch';END IF;
 UPDATE public.bling_worldpay_settlement_events SET status='processed',order_id=oid,processed_at=now()
 WHERE environment=p_environment AND event_id=p_event_id;
 RETURN oid;
END $$;
REVOKE ALL ON FUNCTION public.bling_commit_settled_event(text,text,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_commit_settled_event(text,text,text,uuid,text) TO service_role;
