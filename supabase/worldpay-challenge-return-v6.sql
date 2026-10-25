-- NON-PRODUCTION SUPABASE CLONE ONLY. Requires v3-v5 migrations and tested Preview configuration.
-- A matching issuer return is an UNTRUSTED callback signal, not 3DS approval or payment proof.
ALTER TABLE public.bling_checkout_attempts
 ADD COLUMN IF NOT EXISTS issuer_challenge_reference text,
 ADD COLUMN IF NOT EXISTS issuer_challenge_return_seen boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS bling_unique_issuer_challenge_reference
 ON public.bling_checkout_attempts (issuer_challenge_reference)
 WHERE issuer_challenge_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.bling_register_issuer_challenge(
 p_reference text,p_payment_claim uuid,p_challenge_reference text
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF p_challenge_reference IS NULL OR length(p_challenge_reference) NOT BETWEEN 8 AND 128 OR
    p_challenge_reference !~ '^[A-Za-z0-9_-]+$' THEN RETURN false; END IF;
 UPDATE public.bling_checkout_attempts
 SET issuer_challenge_reference=p_challenge_reference,issuer_challenge_return_seen=false,updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_payment_claim AND status='payment_processing'
 AND provider_outcome='challenge' AND issuer_challenge_reference IS NULL;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.bling_register_issuer_challenge(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_register_issuer_challenge(text,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.bling_mark_issuer_challenge_return(p_challenge_reference text)
 RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF p_challenge_reference IS NULL OR length(p_challenge_reference) NOT BETWEEN 8 AND 128 OR
    p_challenge_reference !~ '^[A-Za-z0-9_-]+$' THEN RETURN false; END IF;
 UPDATE public.bling_checkout_attempts
 SET issuer_challenge_return_seen=true,updated_at=now()
 WHERE issuer_challenge_reference=p_challenge_reference AND status='payment_processing'
   AND provider_outcome='challenge' AND issuer_challenge_return_seen=false;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.bling_mark_issuer_challenge_return(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_mark_issuer_challenge_return(text) TO service_role;

-- Replace v5 atomic claim function to REQUIRE the matching challenge callback when stage=challenge.
CREATE OR REPLACE FUNCTION public.bling_claim_provider_continuation(
 p_reference text,p_payment_claim uuid,p_secret_sha256 text,
 p_expected_stage text,p_continuation_claim uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE actions jsonb; n integer; action_key text;
BEGIN
 IF p_reference IS NULL OR p_payment_claim IS NULL OR p_continuation_claim IS NULL OR
    p_secret_sha256 IS NULL OR p_secret_sha256 !~ '^[a-f0-9]{64}$' OR
    p_expected_stage NOT IN ('device_data','challenge') THEN RETURN NULL; END IF;
 action_key:=CASE p_expected_stage WHEN 'device_data' THEN 'supply3dsDeviceData' ELSE 'complete3dsChallenge' END;
 UPDATE public.bling_checkout_attempts
 SET provider_continuation_claim=p_continuation_claim,
     provider_continuation_stage=p_expected_stage,
     provider_continuation_started_at=now(),updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_payment_claim
   AND browser_secret_sha256=p_secret_sha256
   AND status='payment_processing' AND provider_outcome=p_expected_stage
   AND provider_continuation_claim IS NULL
   AND provider_actions ? action_key
   AND (p_expected_stage='device_data' OR
        (issuer_challenge_return_seen=true AND issuer_challenge_reference IS NOT NULL))
 RETURNING provider_actions INTO actions;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('action',actions ->> action_key);
END $$;
REVOKE ALL ON FUNCTION public.bling_claim_provider_continuation(text,uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_claim_provider_continuation(text,uuid,text,text,uuid) TO service_role;
