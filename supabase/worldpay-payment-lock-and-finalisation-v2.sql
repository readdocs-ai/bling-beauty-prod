-- REVIEW IN A BACKED-UP SUPABASE INSTANCE BEFORE APPLYING.
-- Apply after bling-checkout-attempts.sql and bling-paid-order-finalisation.sql.
-- This migration does NOT enable checkout or make a Worldpay charge.
ALTER TABLE public.bling_checkout_attempts ADD COLUMN IF NOT EXISTS payment_claim_id uuid;
ALTER TABLE public.bling_checkout_attempts ADD COLUMN IF NOT EXISTS payment_claimed_at timestamptz;
ALTER TABLE public.bling_checkout_attempts ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz;
ALTER TABLE public.bling_checkout_attempts ADD COLUMN IF NOT EXISTS provider_last_event text;
CREATE UNIQUE INDEX IF NOT EXISTS bling_checkout_claim_unique ON public.bling_checkout_attempts(payment_claim_id) WHERE payment_claim_id IS NOT NULL;

-- A claim is created once, before any external authorisation call. It is NEVER
-- automatically released after a timeout: query Worldpay before retrying.
CREATE OR REPLACE FUNCTION public.bling_claim_payment(p_reference text, p_claim uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
 IF p_claim IS NULL OR p_reference IS NULL THEN RAISE EXCEPTION 'Missing reference or claim'; END IF;
 UPDATE public.bling_checkout_attempts
 SET status='payment_processing', payment_claim_id=p_claim, payment_claimed_at=now(), updated_at=now()
 WHERE reference=p_reference AND status='pending' AND payment_claim_id IS NULL
   AND currency='GBP' AND amount_pence > 0;
 GET DIAGNOSTICS affected = ROW_COUNT;
 RETURN affected = 1;
END $$;
REVOKE ALL ON FUNCTION public.bling_claim_payment(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bling_claim_payment(text,uuid) TO service_role;

-- Record a verified state only through a privileged server workflow after
-- checking Worldpay response/query against reference, amount and currency.
-- Never call from browser input or an untrusted webhook without verification.
CREATE OR REPLACE FUNCTION public.bling_record_verified_settlement(
 p_reference text, p_claim uuid, p_payment_id text, p_event text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
 IF p_payment_id IS NULL OR length(trim(p_payment_id)) < 3 OR
    p_event NOT IN ('settlement_requested','settled') THEN
  RAISE EXCEPTION 'Unverified payment state';
 END IF;
 UPDATE public.bling_checkout_attempts
 SET status='settlement_verified', provider_payment_id=p_payment_id,
     provider_last_event=p_event, payment_verified_at=now(), updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_claim
   AND status IN ('payment_processing','settlement_verified')
   AND (provider_payment_id IS NULL OR provider_payment_id=p_payment_id)
   AND currency='GBP' AND amount_pence > 0;
 GET DIAGNOSTICS affected = ROW_COUNT;
 RETURN affected = 1;
END $$;
REVOKE ALL ON FUNCTION public.bling_record_verified_settlement(text,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bling_record_verified_settlement(text,uuid,text,text) TO service_role;

-- Restricts paid-order creation. Authorisation-only or pending states fail.
CREATE OR REPLACE FUNCTION public.bling_finalise_verified_payment(p_reference text,p_payment_id text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE a public.bling_checkout_attempts%rowtype; oid uuid;
BEGIN
 IF p_payment_id IS NULL OR length(trim(p_payment_id)) < 3 THEN RAISE EXCEPTION 'Invalid payment id'; END IF;
 SELECT * INTO a FROM public.bling_checkout_attempts WHERE reference=p_reference FOR UPDATE;
 IF NOT FOUND OR a.status NOT IN ('settlement_verified','paid_verified') OR
    a.payment_verified_at IS NULL OR a.provider_payment_id IS DISTINCT FROM p_payment_id OR
    a.provider_last_event NOT IN ('settlement_requested','settled') THEN
  RAISE EXCEPTION 'Payment not independently verified';
 END IF;
 INSERT INTO public.bling_paid_orders(reference,provider_payment_id,amount_pence,currency,items,customer,shipping)
 VALUES (a.reference,p_payment_id,a.amount_pence,a.currency,a.items,a.customer,a.shipping)
 ON CONFLICT (reference) DO NOTHING RETURNING id INTO oid;
 IF oid IS NULL THEN
  SELECT id INTO oid FROM public.bling_paid_orders
  WHERE reference=p_reference AND provider_payment_id=p_payment_id;
  IF oid IS NULL THEN RAISE EXCEPTION 'Existing order payment mismatch'; END IF;
 END IF;
 UPDATE public.bling_checkout_attempts SET status='paid_verified', updated_at=now() WHERE reference=p_reference;
 INSERT INTO public.bling_paid_order_jobs(order_id,kind)
 VALUES (oid,'customer_email'),(oid,'admin_email'),(oid,'royal_mail') ON CONFLICT DO NOTHING;
 RETURN oid;
END $$;
REVOKE ALL ON FUNCTION public.bling_finalise_verified_payment(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bling_finalise_verified_payment(text,text) TO service_role;
