# BLING Beauty Products — consolidated Worldpay release review (21 October 2026)

**RELEASE STATUS: BLOCKED. DO NOT ENABLE ORDERS OR DEPLOY TO PRODUCTION.**

## Confirmed from Preview
- Worldpay secure card session generation passed.
- Worldpay Card Payments v7 Try authorisation returned HTTP 400 `bodyDoesNotMatchSchema`. No authorisation or order was confirmed.
- `WORLDPAY_ENVIRONMENT=try` was added to Preview; prior 404 was the Preview-only application guard.
- The existing customer checkout uses Hosted Payment Pages (HPP), **not** the separate SDK test endpoint. Passing the SDK test will not prove customer checkout works.

## Changes in this package
- Production checkout fails closed if `WORLDPAY_ENVIRONMENT` is absent, misspelled, or set to Try in Vercel Production. It does not automatically fall back to Try.
- Checkout diagnostic logging no longer includes provider URL path fragments that may contain opaque identifiers.
- The Try test page only displays an authorised result when the application response is successful **and** `authorized` is explicitly true.
- Existing Try-only authorisation endpoint, error-code diagnostics, branch safeguards and checkout architecture are preserved. No unverified payment-schema guess has been introduced.

## Still blocking go-live
1. Resolve Worldpay `bodyDoesNotMatchSchema` with the Worldpay v7 schema / merchant-specific implementation guidance and perform a new one-time Try authorisation; never reuse a session. Endpoint and version headers match published docs, but exact rejected field remains unknown.
2. Confirm whether the merchant account supports Hosted Payment Pages. Current customer `/api/checkout` uses `/payment_pages`, while the SDK test uses `/cardPayments/customerInitiatedTransactions`. Choose and complete one approved customer payment journey.
3. Test 3DS/SCA, successful and refused payments, cancellation, return URLs, settlement and provider payment status queries/events.
4. Validate Supabase migrations and paid-order finalisation against actual provider responses. Verify duplicate-event/idempotency handling and customer/admin email delivery.
5. Confirm production secrets, production Worldpay merchant enablement, domain URLs, admin security, database backups and dependency vulnerability remediation.
6. Run a controlled Preview end-to-end order test, then a controlled Live test only with explicit approval.
7. Keep `public.store_settings.orders_suspended=true` until all gates pass and the user approves the go-live change.

## Local validation
- Source changes reviewed; run `npm ci` and `npm run build` in the project folder.
- No Worldpay payment was submitted by this package-generation process.

## Official references
- https://docs.worldpay.com/access/products/card-payments/authorize-a-payment
- https://docs.worldpay.com/access/products/card-payments/v7-migration-guide
- https://docs.worldpay.com/access/products/checkout/web/card-only
