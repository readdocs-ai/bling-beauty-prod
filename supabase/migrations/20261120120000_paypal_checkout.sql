-- Keep PayPal IDs separate from Worldpay's verification evidence.
ALTER TABLE public.bling_checkout_attempts ADD COLUMN IF NOT EXISTS paypal_order_id text UNIQUE;
ALTER TABLE public.bling_paid_orders ADD COLUMN IF NOT EXISTS paypal_order_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.bling_commit_paypal_capture(
  p_reference text, p_paypal_order_id text, p_capture_id text, p_environment text, p_amount integer
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  attempt public.bling_checkout_attempts%rowtype;
  order_id uuid;
  payment_id text := 'paypal:' || p_capture_id;
BEGIN
  IF p_paypal_order_id IS NULL OR p_paypal_order_id !~ '^[A-Za-z0-9]{1,50}$'
    OR p_capture_id IS NULL OR p_capture_id !~ '^[A-Za-z0-9]{1,50}$'
    OR p_environment IS NULL OR p_environment NOT IN ('try', 'live')
    OR p_amount IS NULL OR p_amount < 1 THEN
    RAISE EXCEPTION 'Invalid capture details';
  END IF;

  SELECT * INTO attempt FROM public.bling_checkout_attempts WHERE reference = p_reference FOR UPDATE;
  IF NOT FOUND OR attempt.paypal_order_id IS DISTINCT FROM p_paypal_order_id
    OR attempt.payment_environment IS DISTINCT FROM p_environment
    OR attempt.currency IS DISTINCT FROM 'GBP' OR attempt.amount_pence IS DISTINCT FROM p_amount
    OR attempt.status NOT IN ('pending', 'paid_verified')
    OR (attempt.provider_payment_id IS NOT NULL AND attempt.provider_payment_id <> payment_id)
    OR attempt.payment_claim_id IS NOT NULL THEN
    RAISE EXCEPTION 'Capture does not match the checkout';
  END IF;

  INSERT INTO public.bling_paid_orders (
    reference, provider_payment_id, paypal_order_id, amount_pence, currency,
    items, customer, shipping, payment_environment, royal_mail_status
  ) VALUES (
    attempt.reference, payment_id, p_paypal_order_id, p_amount, 'GBP',
    attempt.items, attempt.customer, attempt.shipping, p_environment,
    CASE WHEN p_environment = 'live' THEN 'paypal_shipping' ELSE 'test_order' END
  ) ON CONFLICT (reference) DO NOTHING RETURNING id INTO order_id;

  IF order_id IS NULL THEN
    SELECT id INTO order_id FROM public.bling_paid_orders
      WHERE reference = attempt.reference AND paypal_order_id = p_paypal_order_id
        AND provider_payment_id = payment_id AND payment_environment = p_environment
        AND amount_pence = p_amount AND currency = 'GBP';
    IF order_id IS NULL THEN RAISE EXCEPTION 'Existing order does not match the capture'; END IF;
  END IF;

  UPDATE public.bling_checkout_attempts SET
    status = 'paid_verified', provider_payment_id = payment_id,
    payment_verified_at = coalesce(payment_verified_at, now()), updated_at = now()
    WHERE reference = attempt.reference;

  INSERT INTO public.bling_paid_order_jobs (order_id, kind)
    VALUES (order_id, 'customer_email'), (order_id, 'admin_email') ON CONFLICT DO NOTHING;
  RETURN order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.bling_commit_paypal_capture(text, text, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bling_commit_paypal_capture(text, text, text, text, integer) TO service_role;
