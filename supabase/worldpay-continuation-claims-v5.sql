-- PREVIEW ONLY. Apply to a backed-up NON-PRODUCTION Supabase clone after v3 and v4.
-- Makes each Worldpay 3DS continuation single-use; no automatic retries after timeouts.
ALTER TABLE public.bling_checkout_attempts
 ADD COLUMN IF NOT EXISTS provider_continuation_claim uuid,
 ADD COLUMN IF NOT EXISTS provider_continuation_stage text,
 ADD COLUMN IF NOT EXISTS provider_continuation_started_at timestamptz;

CREATE OR REPLACE FUNCTION public.bling_claim_provider_continuation(
 p_reference text, p_payment_claim uuid, p_secret_sha256 text,
 p_expected_stage text, p_continuation_claim uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE actions jsonb; n integer; action_key text;
BEGIN
 IF p_reference IS NULL OR p_payment_claim IS NULL OR p_continuation_claim IS NULL OR
    p_secret_sha256 IS NULL OR p_secret_sha256 !~ '^[a-f0-9]{64}$' OR
    p_expected_stage NOT IN ('device_data','challenge') THEN
    RETURN NULL;
 END IF;
 action_key := CASE p_expected_stage WHEN 'device_data' THEN 'supply3dsDeviceData' ELSE 'complete3dsChallenge' END;
 UPDATE public.bling_checkout_attempts
 SET provider_continuation_claim=p_continuation_claim,
     provider_continuation_stage=p_expected_stage,
     provider_continuation_started_at=now(), updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_payment_claim
   AND browser_secret_sha256=p_secret_sha256
   AND status='payment_processing' AND provider_outcome=p_expected_stage
   AND provider_continuation_claim IS NULL
   AND provider_actions ? action_key
 RETURNING provider_actions INTO actions;
 GET DIAGNOSTICS n = ROW_COUNT;
 IF n <> 1 THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('action', actions ->> action_key);
END $$;
REVOKE ALL ON FUNCTION public.bling_claim_provider_continuation(text,uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_claim_provider_continuation(text,uuid,text,text,uuid) TO service_role;

-- Progress storage must prove that it is ending the EXACT claimed continuation.
-- Do not replace v3 function blindly: separate RPC prevents stale writes.
CREATE OR REPLACE FUNCTION public.bling_store_continuation_progress(
 p_reference text, p_payment_claim uuid, p_continuation_claim uuid,
 p_outcome text, p_actions jsonb, p_correlation text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
 IF p_reference IS NULL OR p_payment_claim IS NULL OR p_continuation_claim IS NULL OR
    p_outcome NOT IN ('device_data','challenge','authorised','settlement_requested','declined','uncertain') OR
    p_actions IS NULL OR jsonb_typeof(p_actions) <> 'object' OR pg_column_size(p_actions) > 12000 THEN
  RETURN false;
 END IF;
 UPDATE public.bling_checkout_attempts
 SET provider_outcome=p_outcome, provider_actions=p_actions,
     provider_correlation_id=left(p_correlation,200), provider_updated_at=now(),
     provider_continuation_stage=NULL, provider_continuation_claim=NULL,
     provider_continuation_started_at=NULL, updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_payment_claim
   AND provider_continuation_claim=p_continuation_claim AND status='payment_processing';
 GET DIAGNOSTICS n = ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.bling_store_continuation_progress(text,uuid,uuid,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_store_continuation_progress(text,uuid,uuid,text,jsonb,text) TO service_role;
-- NOTE: timeout leaves continuation claimed; recover only after provider query/manual reconciliation.
