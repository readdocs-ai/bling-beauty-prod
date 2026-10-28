-- A server-stored settlement policy prevents a manual capture after auto settlement.
-- Existing attempts retain the original manual policy. This does not enable auto settlement.
ALTER TABLE public.bling_checkout_attempts ADD COLUMN IF NOT EXISTS settlement_mode text NOT NULL DEFAULT 'manual'
 CHECK(settlement_mode IN ('manual','auto'));
ALTER TABLE public.bling_worldpay_settlement_events ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

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
  AND status='payment_processing' AND provider_outcome='authorised' AND settlement_mode='manual'
  AND provider_continuation_claim IS NULL
  AND (provider_actions->>'settlePayment' IS NULL OR provider_actions->>'settlePayment'=p_verified_action)
  AND (provider_payment_id IS NULL OR provider_payment_id=p_verified_payment_id)
 RETURNING * INTO a;
 IF NOT FOUND THEN RETURN NULL;END IF;
 RETURN jsonb_build_object('action',a.provider_actions->>'settlePayment');
END $$;
REVOKE ALL ON FUNCTION public.bling_claim_settlement(text,uuid,text,uuid,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_claim_settlement(text,uuid,text,uuid,text,integer,text) TO service_role;

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
  (a.provider_payment_id IS DISTINCT FROM p_payment_id AND NOT (a.settlement_mode='auto' AND a.provider_payment_id IS NULL)) OR
  p_payment_id !~ '^[A-Za-z0-9_-]{3,128}$' OR a.amount_pence<>e.amount_pence OR a.currency<>'GBP' OR
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
