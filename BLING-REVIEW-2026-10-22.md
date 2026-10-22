# BLING Worldpay review — 22 October 2026

## Code change
- Validate configured HTTPS payment return origin **before** inserting a pending checkout attempt. Previously a missing/invalid origin could leave a pending record that could never redirect to Worldpay.

## Confirmed outstanding blocker
- Worldpay Try Card Payments v7 rejects the current `card/checkout` session payment request with HTTP 400 `bodyDoesNotMatchSchema`. The exact offending field has not been established. The payment payload was deliberately not guessed or switched to an unverified card-handling flow.
- The admin SDK authorisation test is **not** the customer Hosted Payment Pages checkout. A successful admin test would not prove customer checkout works.

## Mandatory go-live gates
1. Obtain Worldpay's exact schema/validation detail or confirm the supported SDK-to-Card-Payments journey and request structure with Worldpay implementation support.
2. Verify Worldpay merchant permissions, live credentials and production API access.
3. Test the actual customer checkout, including SCA/3DS, failed/cancelled payments, redirects and payment-query response.
4. Verify server-side settlement status, duplicate callbacks, Supabase order creation and customer/admin emails.
5. Confirm production environment settings and merchant approval, then explicitly approve removal of `orders_suspended` only after all tests pass.

**Not production ready.** No live payment, capture, 3DS or end-to-end order test has been performed by this review.
