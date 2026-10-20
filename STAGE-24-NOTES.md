# Stage 24 — checkout input validation (development only)

- Added POST /api/checkout/preflight to validate customer and UK delivery fields, reject unrecognised products and enforce a ten-per-product limit.
- Server derives £130 catalogue prices independently of client-submitted prices.
- Order suspension is checked before accepting any preflight request. Missing/unavailable store_settings fails closed.
- This endpoint deliberately does NOT save customer details, create orders, contact Worldpay, or accept payment. It returns paymentEnabled:false and no final total because delivery fees have not been defined.
- No existing checkout or admin pages have been changed. Production deployment is not approved.

## Next blockers

1. Confirm shipping charges, VAT treatment and exact product contents/availability.
2. Complete Worldpay Access Checkout tokenisation + Payments API according to verified Worldpay documentation, including 3DS and secure payment-result verification.
3. Implement idempotent pending order creation and paid-order state transitions after the database migration has been applied and reviewed.
4. Test end-to-end in a Preview deployment with Try credentials, then Royal Mail, email and a successful production build.

Worldpay Try credentials and Checkout ID were saved by the owner to Preview Vercel variables. The Worldpay Entity ID is shown in the dashboard but not known to be configured as WORLDPAY_ENTITY. Do not move Try secrets into Production.
