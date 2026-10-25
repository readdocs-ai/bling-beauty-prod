-- PREVIEW ONLY: review on a non-production Supabase clone first.
-- Apply after worldpay-persistent-attempts-v3.sql.
-- Stores a hash of an unpredictable checkout ownership secret, not the secret itself.
ALTER TABLE public.bling_checkout_attempts
  ADD COLUMN IF NOT EXISTS browser_secret_sha256 text;
CREATE OR REPLACE FUNCTION public.bling_claim_owned_payment(
  p_reference text, p_claim uuid, p_secret_sha256 text
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
 IF p_claim IS NULL OR p_reference IS NULL OR
    p_secret_sha256 IS NULL OR p_secret_sha256 !~ '^[a-f0-9]{64}$' THEN
   RETURN false;
 END IF;
 UPDATE public.bling_checkout_attempts
 SET status='payment_processing', payment_claim_id=p_claim,
     payment_claimed_at=now(), updated_at=now()
 WHERE reference=p_reference AND status='pending' AND payment_claim_id IS NULL
   AND browser_secret_sha256=p_secret_sha256
   AND currency='GBP' AND amount_pence > 0;
 GET DIAGNOSTICS n = ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.bling_claim_owned_payment(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_claim_owned_payment(text,uuid,text) TO service_role;
-- Migration adds no browser SELECT/UPDATE RLS permissions.
