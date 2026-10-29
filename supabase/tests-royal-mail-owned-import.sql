-- Run as one transaction. All synthetic rows are rolled back. No provider calls.
BEGIN;
DO $$
DECLARE ref text:='BLING-'||gen_random_uuid()::text; oid uuid; claim uuid:=gen_random_uuid(); rmref text; ok boolean;
BEGIN
 rmref:='BLING-'||replace(substr(ref,7),'-','');
 INSERT INTO public.bling_checkout_attempts(reference,status,amount_pence,currency,items,customer,shipping,payment_environment)
 VALUES(ref,'paid_verified',13000,'GBP','[]','{}','{}','live');
 INSERT INTO public.bling_paid_orders(reference,provider_payment_id,amount_pence,currency,items,customer,shipping,payment_environment,provider_event_id)
 VALUES(ref,'sql-shipping-test-'||gen_random_uuid(),13000,'GBP','[]','{}','{}','try','synthetic-sql-test') RETURNING id INTO oid;
 INSERT INTO public.bling_paid_order_jobs(order_id,kind) VALUES(oid,'royal_mail');
 IF public.bling_claim_royal_mail_import(oid,claim,500,0,'smallParcel',rmref) THEN RAISE EXCEPTION 'Try order import accepted';END IF;
 UPDATE public.bling_paid_orders SET payment_environment='live' WHERE id=oid;
 IF public.bling_claim_royal_mail_import(oid,claim,0,0,'smallParcel',rmref) THEN RAISE EXCEPTION 'Unmeasured parcel accepted';END IF;
 IF public.bling_claim_royal_mail_import(oid,claim,500,0,'smallParcel','wrong') THEN RAISE EXCEPTION 'Reference mismatch accepted';END IF;
 IF NOT public.bling_claim_royal_mail_import(oid,claim,500,0,'smallParcel',rmref) THEN RAISE EXCEPTION 'Valid import claim rejected';END IF;
 IF public.bling_claim_royal_mail_import(oid,gen_random_uuid(),500,0,'smallParcel',rmref) THEN RAISE EXCEPTION 'Duplicate import claim accepted';END IF;
 IF public.bling_finish_royal_mail_import(oid,gen_random_uuid(),rmref,'12345',NULL,NULL) THEN RAISE EXCEPTION 'Wrong claim accepted';END IF;
 IF NOT public.bling_finish_royal_mail_import(oid,claim,rmref,'12345',NULL,NULL) THEN RAISE EXCEPTION 'Valid import completion rejected';END IF;
 IF NOT public.bling_finish_royal_mail_import(oid,claim,rmref,'12345','AA123456789GB',now()) THEN RAISE EXCEPTION 'Tracking sync rejected';END IF;
 IF public.bling_finish_royal_mail_import(oid,claim,rmref,'99999',NULL,NULL) THEN RAISE EXCEPTION 'Mismatched provider ID accepted';END IF;
 IF public.bling_finish_royal_mail_import(oid,claim,rmref,'12345','BB123456789GB',now()) THEN RAISE EXCEPTION 'Mismatched tracking accepted';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.bling_paid_order_jobs WHERE order_id=oid AND kind='royal_mail' AND status='completed') THEN RAISE EXCEPTION 'Completion not persisted';END IF;
END $$;
ROLLBACK;
