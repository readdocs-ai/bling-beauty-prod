# Worldpay replacement checkout — implementation checkpoint

## Added
- `/admin/worldpay-sdk-test`: authenticated admin-only, Vercel Preview-only, Try-only Worldpay Access Checkout v2 secure-fields integration smoke test.
- Loads Worldpay's official Try SDK and initialises PAN, expiry, CVC iframes using the existing Try Checkout ID.
- Does not generate sessions, submit payment requests, store card data, or change order state.
- Existing HPP checkout, order processing, and suspension switch are unchanged.

## To test
1. Deploy to Vercel Preview only (`vercel deploy`). Do not deploy to production.
2. Log in to `/admin/login`, then open `/admin/worldpay-sdk-test`.
3. Confirm status says `Worldpay secure card fields loaded successfully`. No real card numbers are needed.
4. If it fails, collect browser Console errors with any tokens/credentials redacted.

## Still required before replacing HPP
- Implement server-side customer-initiated payment creation with server-calculated basket totals and idempotency.
- Implement 3D Secure challenge / authentication lifecycle and recovery.
- Verify definitive payment outcome via authenticated provider query or signed webhook before finalising orders.
- Exercise successful payment, refusal, 3DS, timeout, duplicate and order fulfilment tests.
- Confirm live merchant authorisation, live Checkout ID, and live credentials.
- Only after approval, choose the new payment flow and lift ordering suspension.

Worldpay SDK docs: https://docs.worldpay.com/access/products/checkout/web/card-only
