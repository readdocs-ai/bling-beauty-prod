# BLING Beauty Products — master prelaunch update (19 October 2026)

## Implemented in this package
- Separate Terms, Returns, Privacy and Shipping pages, plus policies index and footer links.
- Existing HPP checkout, order handling, Worldpay diagnostics and permission test preserved without modification.

## NOT IMPLEMENTED / NOT VERIFIED — DO NOT DEPLOY AS LIVE PAYMENTS
- Worldpay Access Checkout SDK card capture and server-side Card Payments API authorisation are NOT yet implemented.
- 3-D Secure / Strong Customer Authentication, failed/declined/challenged flows, webhook/payment-query reconciliation and refund handling for the new API have NOT been end-to-end tested.
- Try-mode read-only GET /cardPayments succeeded (HTTP 200); this does NOT establish charge permission or live entitlements.
- HPP is still returning HTTP 400 and is not a working payment fallback.
- Business legal identity/address, controller identity, delivery estimates, return address, final cookie inventory, VAT status and policy wording require owner/legal verification.
- Live-mode Checkout ID and API entitlements remain unconfirmed.

## Safe launch gates
1. Verify legal identity, address, privacy practices and fulfilment policy; update pages accordingly.
2. Implement SDK card session collection and server-side payment authorisation following Worldpay v7 API documentation; never handle raw PAN/CVV.
3. Implement and test 3DS/SCA, all payment outcomes, idempotency, order verification and fulfilment exactly once.
4. Test on Vercel Preview against Worldpay Try with successful, declined, challenged and interrupted flows.
5. Verify live credentials, Checkout ID, Worldpay live processing permissions and production environment variables.
6. Only then approve a production deployment and activate customer checkout.

References: https://docs.worldpay.com/access/products/checkout/web and https://docs.worldpay.com/access/products/card-payments/authorize-a-payment
