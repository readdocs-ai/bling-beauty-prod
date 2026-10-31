-- Authenticated provider query evidence, separate from webhook receipts and final settlement.
ALTER TABLE public.bling_checkout_attempts ADD COLUMN capture_last_checked_at timestamptz;
CREATE TABLE public.bling_worldpay_capture_verifications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reference text NOT NULL UNIQUE REFERENCES public.bling_checkout_attempts(reference),
 payment_environment text NOT NULL DEFAULT 'live' CHECK(payment_environment='live'),
 provider_payment_id text NOT NULL UNIQUE CHECK(provider_payment_id ~ '^[A-Za-z0-9_-]{3,128}$'),
 merchant_entity text NOT NULL CHECK(length(trim(merchant_entity))>0),
 amount_pence integer NOT NULL CHECK(amount_pence>0),currency text NOT NULL DEFAULT 'GBP' CHECK(currency='GBP'),
 query_event text NOT NULL CHECK(query_event='settlementrequestsubmitted'),
 proof_sha256 text NOT NULL CHECK(proof_sha256 ~ '^[a-f0-9]{64}$'),
 source text NOT NULL DEFAULT 'payment_queries' CHECK(source='payment_queries'),checked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bling_worldpay_capture_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bling_worldpay_capture_verifications FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.bling_worldpay_capture_verifications TO service_role;
ALTER TABLE public.bling_paid_orders ADD COLUMN provider_verification_id uuid REFERENCES public.bling_worldpay_capture_verifications(id);
CREATE FUNCTION public.bling_commit_api_capture(p_reference text,p_claim uuid,p_payment_id text,p_amount integer,p_entity text,p_query_event text,p_proof_sha256 text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE a public.bling_checkout_attempts%rowtype; v public.bling_worldpay_capture_verifications%rowtype; oid uuid;
BEGIN
 IF p_claim IS NULL OR p_payment_id IS NULL OR p_payment_id !~ '^[A-Za-z0-9_-]{3,128}$' OR p_amount IS NULL OR p_amount<1 OR
  p_entity IS NULL OR length(trim(p_entity))=0 OR p_query_event IS DISTINCT FROM 'settlementrequestsubmitted' OR
  p_proof_sha256 IS NULL OR p_proof_sha256 !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Unverified capture'; END IF;
 SELECT * INTO a FROM public.bling_checkout_attempts WHERE reference=p_reference FOR UPDATE;
 IF NOT FOUND OR a.payment_environment IS DISTINCT FROM 'live' OR a.settlement_mode IS DISTINCT FROM 'auto' OR
  a.status NOT IN ('payment_processing','paid_verified') OR a.currency<>'GBP' OR a.amount_pence IS DISTINCT FROM p_amount OR
  a.payment_claim_id IS DISTINCT FROM p_claim OR (a.provider_payment_id IS NOT NULL AND a.provider_payment_id<>p_payment_id)
 THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 INSERT INTO public.bling_worldpay_capture_verifications(reference,provider_payment_id,merchant_entity,amount_pence,query_event,proof_sha256)
 VALUES(p_reference,p_payment_id,p_entity,p_amount,p_query_event,p_proof_sha256) ON CONFLICT(reference) DO NOTHING;
 SELECT * INTO v FROM public.bling_worldpay_capture_verifications WHERE reference=p_reference;
 IF v.provider_payment_id IS DISTINCT FROM p_payment_id OR v.merchant_entity IS DISTINCT FROM p_entity OR
  v.amount_pence IS DISTINCT FROM p_amount OR v.proof_sha256 IS DISTINCT FROM p_proof_sha256 THEN RAISE EXCEPTION 'Evidence mismatch'; END IF;
 INSERT INTO public.bling_paid_orders(reference,provider_payment_id,amount_pence,currency,items,customer,shipping,payment_environment,provider_verification_id,payment_confirmation_stage)
 VALUES(a.reference,p_payment_id,a.amount_pence,'GBP',a.items,a.customer,a.shipping,'live',v.id,'settlement_submitted')
 ON CONFLICT(reference) DO NOTHING RETURNING id INTO oid;
 IF oid IS NULL THEN
  SELECT id INTO oid FROM public.bling_paid_orders WHERE reference=a.reference AND provider_payment_id=p_payment_id AND amount_pence=p_amount AND payment_environment='live';
  IF oid IS NULL THEN RAISE EXCEPTION 'Existing order mismatch'; END IF;
 END IF;
 UPDATE public.bling_checkout_attempts SET status='paid_verified',provider_payment_id=p_payment_id,provider_last_event='settlementRequestSubmitted',payment_verified_at=coalesce(payment_verified_at,now()),updated_at=now() WHERE reference=a.reference;
 INSERT INTO public.bling_paid_order_jobs(order_id,kind) VALUES(oid,'customer_email'),(oid,'admin_email'),(oid,'royal_mail') ON CONFLICT DO NOTHING;
 RETURN oid;
END $$;
REVOKE ALL ON FUNCTION public.bling_commit_api_capture(text,uuid,text,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_commit_api_capture(text,uuid,text,integer,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.bling_claim_royal_mail_import(
 p_order_id uuid,p_claim uuid,p_weight integer,p_tax integer,p_format text,p_reference text
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.bling_paid_orders%rowtype; n integer;
BEGIN
 IF p_claim IS NULL OR p_weight IS NULL OR p_weight NOT BETWEEN 1 AND 30000 OR p_tax IS NULL OR p_tax<0 OR
  p_format IS NULL OR p_format NOT IN ('smallParcel','mediumParcel','largeParcel','parcel') OR p_reference IS NULL THEN RETURN false;END IF;
 SELECT * INTO o FROM public.bling_paid_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.status<>'paid' OR o.payment_environment IS DISTINCT FROM 'live' OR o.verified_at IS NULL OR
  (o.provider_event_id IS NULL AND o.provider_verification_id IS NULL) OR o.provider_payment_id IS NULL OR o.currency<>'GBP' OR p_tax>o.amount_pence OR
  o.royal_mail_claim_id IS NOT NULL OR o.royal_mail_order_id IS NOT NULL OR
  o.reference !~ '^BLING-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' OR
  p_reference IS DISTINCT FROM ('BLING-'||replace(substr(o.reference,7),'-','')) THEN RETURN false;END IF;
 UPDATE public.bling_paid_order_jobs SET status='sending',claimed_at=now(),last_error=NULL
 WHERE order_id=p_order_id AND kind='royal_mail' AND status='pending';
 GET DIAGNOSTICS n=ROW_COUNT;IF n<>1 THEN RETURN false;END IF;
 UPDATE public.bling_paid_orders SET royal_mail_claim_id=p_claim,royal_mail_reference=p_reference,
  royal_mail_status='importing',parcel_weight_grams=p_weight,royal_mail_tax_pence=p_tax,royal_mail_package_format=p_format
 WHERE id=p_order_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.bling_claim_royal_mail_import(uuid,uuid,integer,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_claim_royal_mail_import(uuid,uuid,integer,integer,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.bling_finish_royal_mail_import(
 p_order_id uuid,p_claim uuid,p_reference text,p_provider_id text,p_tracking text,p_shipped_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.bling_paid_orders%rowtype;
BEGIN
 IF p_claim IS NULL OR p_provider_id IS NULL OR p_provider_id !~ '^[1-9][0-9]{0,15}$' OR
  (p_tracking IS NOT NULL AND p_tracking !~ '^[A-Za-z0-9-]{6,60}$') THEN RETURN false;END IF;
 SELECT * INTO o FROM public.bling_paid_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.status<>'paid' OR o.payment_environment IS DISTINCT FROM 'live' OR o.verified_at IS NULL OR
  (o.provider_event_id IS NULL AND o.provider_verification_id IS NULL) OR o.royal_mail_claim_id IS DISTINCT FROM p_claim OR o.royal_mail_reference IS DISTINCT FROM p_reference OR
  (o.royal_mail_order_id IS NOT NULL AND o.royal_mail_order_id<>p_provider_id) OR
  (o.royal_mail_tracking_number IS NOT NULL AND p_tracking IS NOT NULL AND o.royal_mail_tracking_number<>p_tracking) THEN RETURN false;END IF;
 UPDATE public.bling_paid_orders SET royal_mail_order_id=p_provider_id,
  royal_mail_status=CASE WHEN coalesce(p_shipped_at,o.royal_mail_shipped_at) IS NOT NULL THEN 'dispatched' ELSE 'imported' END,
  royal_mail_tracking_number=coalesce(p_tracking,royal_mail_tracking_number),
  royal_mail_shipped_at=coalesce(p_shipped_at,royal_mail_shipped_at),royal_mail_synced_at=now() WHERE id=p_order_id;
 UPDATE public.bling_paid_order_jobs SET status='completed',completed_at=now(),provider_id=p_provider_id,last_error=NULL
 WHERE order_id=p_order_id AND kind='royal_mail';
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.bling_finish_royal_mail_import(uuid,uuid,text,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bling_finish_royal_mail_import(uuid,uuid,text,text,text,timestamptz) TO service_role;
