-- Additive Preview migration. Inspect existing RPCs first; test on a backed-up clone.
-- Uses the existing durable continuation columns. The settlement claim is NEVER cleared.
CREATE OR REPLACE FUNCTION public.bling_claim_settlement(
 p_reference text,p_payment_claim uuid,p_secret_sha256 text,p_capture_claim uuid,
 p_verified_payment_id text,p_verified_amount integer,p_verified_action text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE a public.bling_checkout_attempts%rowtype;
BEGIN
 IF p_reference IS NULL OR p_payment_claim IS NULL OR p_capture_claim IS NULL OR
    p_secret_sha256 IS NULL OR p_secret_sha256 !~ '^[a-f0-9]{64}$' OR
    p_verified_payment_id IS NULL OR p_verified_payment_id !~ '^[A-Za-z0-9_-]{3,128}$' OR
    p_verified_amount IS NULL OR p_verified_amount<1 OR p_verified_action IS NULL OR length(p_verified_action)>4096 OR
    p_verified_action !~ '^https://try[.]access[.]worldpay[.]com/(api/payments/.+/settlements|payments/settlements/full/.+)$' OR
    p_verified_action ~ '[?#]'  THEN RETURN NULL;END IF;
 UPDATE public.bling_checkout_attempts SET
  provider_continuation_claim=p_capture_claim,provider_continuation_stage='capture',
  provider_continuation_started_at=now(),provider_payment_id=p_verified_payment_id,
  provider_actions=provider_actions||jsonb_build_object('settlePayment',p_verified_action),updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_payment_claim
  AND browser_secret_sha256=p_secret_sha256 AND amount_pence=p_verified_amount AND currency='GBP'
  AND status='payment_processing' AND provider_outcome='authorised'
  AND provider_continuation_claim IS NULL
  AND (provider_actions->>'settlePayment' IS NULL OR provider_actions->>'settlePayment'=p_verified_action)
  AND (provider_payment_id IS NULL OR provider_payment_id=p_verified_payment_id)
 RETURNING * INTO a;
 IF NOT FOUND THEN RETURN NULL;END IF;
 RETURN jsonb_build_object('action',a.provider_actions->>'settlePayment');
END $$;
REVOKE ALL ON FUNCTION public.bling_claim_settlement(text,uuid,text,uuid,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_claim_settlement(text,uuid,text,uuid,text,integer,text) TO service_role;

CREATE OR REPLACE FUNCTION public.bling_store_settlement_progress(
 p_reference text,p_payment_claim uuid,p_capture_claim uuid,p_outcome text,p_actions jsonb,p_correlation text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF p_outcome IS NULL OR p_outcome NOT IN ('settlement_requested','uncertain') OR
    p_actions IS NULL OR jsonb_typeof(p_actions)<>'object' OR pg_column_size(p_actions)>12000 THEN RETURN false;END IF;
 UPDATE public.bling_checkout_attempts SET provider_outcome=p_outcome,provider_actions=p_actions,
  provider_correlation_id=left(p_correlation,200),provider_updated_at=now(),updated_at=now()
 WHERE reference=p_reference AND payment_claim_id=p_payment_claim
  AND provider_continuation_claim=p_capture_claim AND provider_continuation_stage='capture'
  AND status='payment_processing' AND provider_outcome='authorised';
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.bling_store_settlement_progress(text,uuid,uuid,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_store_settlement_progress(text,uuid,uuid,text,jsonb,text) TO service_role;
