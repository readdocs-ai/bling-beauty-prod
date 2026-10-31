-- Recovered copy of the migration installed 31 October 2026. No new remote application required.
ALTER TABLE public.bling_worldpay_settlement_events
 ADD COLUMN event_type text NOT NULL DEFAULT 'settled' CHECK(event_type IN ('settled','sentForSettlement')),
 ADD COLUMN authentication_method text NOT NULL DEFAULT 'hmac' CHECK(authentication_method IN ('hmac','worldpay_ip')),
 ADD COLUMN provider_payment_id text,
 ADD COLUMN merchant_entity text,
 ADD COLUMN source_ip text,
 ADD COLUMN query_event text,
 ADD COLUMN independently_verified_at timestamptz;
ALTER TABLE public.bling_paid_orders ADD COLUMN payment_confirmation_stage text NOT NULL DEFAULT 'settled'
 CHECK(payment_confirmation_stage IN ('settled','settlement_submitted'));
CREATE OR REPLACE FUNCTION public.bling_commit_settled_event(p_environment text, p_event_id text, p_body_sha256 text, p_claim uuid, p_payment_id text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE e public.bling_worldpay_settlement_events%rowtype;
 a public.bling_checkout_attempts%rowtype; oid uuid;
BEGIN
 SELECT * INTO e FROM public.bling_worldpay_settlement_events
 WHERE environment=p_environment AND event_id=p_event_id FOR UPDATE;
 IF NOT FOUND OR e.body_sha256 IS DISTINCT FROM p_body_sha256 OR e.event_type<>'settled' OR e.authentication_method<>'hmac' THEN RAISE EXCEPTION 'Event mismatch';END IF;
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
END $function$
;

CREATE OR REPLACE FUNCTION public.bling_commit_wpecom_event(p_environment text, p_event_id text, p_body_sha256 text, p_claim uuid, p_payment_id text, p_entity text, p_query_event text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE e public.bling_worldpay_settlement_events%rowtype;
 a public.bling_checkout_attempts%rowtype; oid uuid;
BEGIN
 IF p_environment IS DISTINCT FROM 'live' OR p_query_event IS DISTINCT FROM 'settlementrequestsubmitted' OR
  p_entity IS NULL OR length(trim(p_entity))<1 OR p_claim IS NULL OR p_payment_id IS NULL OR
  p_payment_id !~ '^[A-Za-z0-9_-]{3,128}$' THEN RAISE EXCEPTION 'Unverified capture';END IF;
 SELECT * INTO e FROM public.bling_worldpay_settlement_events
 WHERE environment=p_environment AND event_id=p_event_id FOR UPDATE;
 IF NOT FOUND OR e.body_sha256 IS DISTINCT FROM p_body_sha256 OR e.event_type<>'sentForSettlement' OR
  e.authentication_method<>'worldpay_ip' OR e.source_ip IS NULL OR e.source_ip NOT IN ('34.246.73.11','52.215.22.123','52.31.61.0','18.130.125.132','35.176.91.145','52.56.235.128','18.185.7.67','18.185.134.117','18.185.158.215','52.48.6.187','34.243.65.63','3.255.13.18','3.251.36.74','63.32.208.6','52.19.45.138','3.11.50.124','3.11.213.43','3.14.190.43','3.121.172.32','3.125.11.252','3.126.98.120','3.139.153.185','3.139.255.63','13.200.51.10','13.200.56.25','13.232.151.127','34.236.63.10','34.253.172.98','35.170.209.108','35.177.246.6','52.4.68.25','52.51.12.88','108.129.30.203') OR
  e.provider_payment_id IS DISTINCT FROM p_payment_id OR e.merchant_entity IS DISTINCT FROM p_entity
  THEN RAISE EXCEPTION 'Event mismatch';END IF;
 SELECT * INTO a FROM public.bling_checkout_attempts WHERE reference=e.reference FOR UPDATE;
 IF NOT FOUND OR a.payment_environment IS DISTINCT FROM 'live' OR a.settlement_mode<>'auto' OR
  a.payment_claim_id IS DISTINCT FROM p_claim OR a.amount_pence<>e.amount_pence OR a.currency<>'GBP' OR
  (a.provider_payment_id IS NOT NULL AND a.provider_payment_id<>p_payment_id) OR
  a.status NOT IN ('payment_processing','paid_verified') THEN RAISE EXCEPTION 'Payment mismatch';END IF;
 IF e.status='processed' THEN RETURN e.order_id;END IF;
 INSERT INTO public.bling_paid_orders(reference,provider_payment_id,amount_pence,currency,items,customer,shipping,
  payment_environment,provider_event_id,payment_confirmation_stage)
 VALUES(a.reference,p_payment_id,a.amount_pence,a.currency,a.items,a.customer,a.shipping,'live',p_event_id,'settlement_submitted')
 ON CONFLICT(reference) DO NOTHING RETURNING id INTO oid;
 IF oid IS NULL THEN
  SELECT id INTO oid FROM public.bling_paid_orders WHERE reference=a.reference AND provider_payment_id=p_payment_id
   AND amount_pence=a.amount_pence AND payment_environment='live';
  IF oid IS NULL THEN RAISE EXCEPTION 'Existing order mismatch';END IF;
 END IF;
 UPDATE public.bling_checkout_attempts SET status='paid_verified',provider_payment_id=p_payment_id,
  provider_last_event='sentForSettlement',payment_verified_at=coalesce(payment_verified_at,now()),updated_at=now()
 WHERE reference=a.reference;
 INSERT INTO public.bling_paid_order_jobs(order_id,kind)
 VALUES(oid,'customer_email'),(oid,'admin_email'),(oid,'royal_mail') ON CONFLICT DO NOTHING;
 UPDATE public.bling_worldpay_settlement_events SET status='processed',order_id=oid,processed_at=now(),
  query_event=p_query_event,independently_verified_at=now() WHERE environment='live' AND event_id=p_event_id;
 RETURN oid;
END $function$
;

REVOKE ALL ON FUNCTION public.bling_commit_wpecom_event(text,text,text,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_commit_wpecom_event(text,text,text,uuid,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.bling_commit_settled_event(text,text,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_commit_settled_event(text,text,text,uuid,text) TO service_role;

