-- Additive Bling-only draft import; no postage purchase or shared-account settings.
ALTER TABLE public.bling_paid_orders
 ADD COLUMN IF NOT EXISTS royal_mail_claim_id uuid,
 ADD COLUMN IF NOT EXISTS royal_mail_reference text,
 ADD COLUMN IF NOT EXISTS royal_mail_tax_pence integer,
 ADD COLUMN IF NOT EXISTS royal_mail_package_format text,
 ADD COLUMN IF NOT EXISTS royal_mail_tracking_number text,
 ADD COLUMN IF NOT EXISTS royal_mail_shipped_at timestamptz,
 ADD COLUMN IF NOT EXISTS royal_mail_synced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS bling_paid_royal_mail_reference_unique ON public.bling_paid_orders(royal_mail_reference) WHERE royal_mail_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bling_paid_royal_mail_id_unique ON public.bling_paid_orders(royal_mail_order_id) WHERE royal_mail_order_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.bling_claim_royal_mail_import(
 p_order_id uuid,p_claim uuid,p_weight integer,p_tax integer,p_format text,p_reference text
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE o public.bling_paid_orders%rowtype; n integer;
BEGIN
 IF p_claim IS NULL OR p_weight IS NULL OR p_weight NOT BETWEEN 1 AND 30000 OR p_tax IS NULL OR p_tax<0 OR
  p_format IS NULL OR p_format NOT IN ('smallParcel','mediumParcel','largeParcel','parcel') OR p_reference IS NULL THEN RETURN false;END IF;
 SELECT * INTO o FROM public.bling_paid_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.status<>'paid' OR o.payment_environment IS DISTINCT FROM 'live' OR o.verified_at IS NULL OR
  o.provider_event_id IS NULL OR o.provider_payment_id IS NULL OR o.currency<>'GBP' OR p_tax>o.amount_pence OR
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
  o.provider_event_id IS NULL OR o.royal_mail_claim_id IS DISTINCT FROM p_claim OR o.royal_mail_reference IS DISTINCT FROM p_reference OR
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
