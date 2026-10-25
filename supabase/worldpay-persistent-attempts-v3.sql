-- Preview migration. Apply to a BACKED-UP NON-PRODUCTION Supabase project first.
-- Requires bling-checkout-attempts.sql and worldpay-payment-lock-and-finalisation-v2.sql.
ALTER TABLE public.bling_checkout_attempts
 ADD COLUMN IF NOT EXISTS provider_outcome text,
 ADD COLUMN IF NOT EXISTS provider_actions jsonb NOT NULL DEFAULT '{}'::jsonb,
 ADD COLUMN IF NOT EXISTS provider_correlation_id text,
 ADD COLUMN IF NOT EXISTS provider_updated_at timestamptz;

-- Claim must already have succeeded before this function is used.
-- This only stores Worldpay's response; it NEVER finalises an order or sends email.
CREATE OR REPLACE FUNCTION public.bling_store_provider_progress(
 p_reference text, p_claim uuid, p_outcome text, p_actions jsonb,
 p_correlation text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
 IF p_claim IS NULL OR p_reference IS NULL OR
    p_outcome NOT IN ('device_data','challenge','authorised','settlement_requested','declined','uncertain') OR
    p_actions IS NULL OR jsonb_typeof(p_actions) <> 'object' OR
    pg_column_size(p_actions) > 12000 THEN
  RAISE EXCEPTION 'Invalid provider progress';
 END IF;
 UPDATE public.bling_checkout_attempts
 SET provider_outcome=p_outcome, provider_actions=p_actions,
     provider_correlation_id=left(p_correlation,200),
     provider_updated_at=now(), updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_claim
   AND status='payment_processing';
 GET DIAGNOSTICS n = ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.bling_store_provider_progress(text,uuid,text,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bling_store_provider_progress(text,uuid,text,jsonb,text) TO service_role;

-- All payment-stage fields remain service-role only. Never create a browser RLS policy.
