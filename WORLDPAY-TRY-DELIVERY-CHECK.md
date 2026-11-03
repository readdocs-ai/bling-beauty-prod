# Worldpay Try delivery check

`/api/worldpay/try-delivery-check` is a temporary diagnostic receiver, separate from `/api/worldpay/events`.

It is unavailable unless all three server settings match:

- `VERCEL_ENV=preview`
- `WORLDPAY_ENVIRONMENT=try`
- `BLING_PREVIEW_WEBHOOK_DELIVERY_CHECK=true`

An enabled GET returns a diagnostic health response. POST accepts bounded JSON (64 KiB maximum), logs only byte count, an allowlisted event type and whether a signature header was present, and responds with `verified:false` and `paymentProcessing:false`. A signature's presence does not establish its validity.

This receiver intentionally acknowledges and discards test notifications. It never writes a settlement receipt, creates an order, calls a payment API or sends email. Do not use it for actual payment confirmation or configure it in Live mode. It cannot substitute for signed-event verification.

Keep Preview deployment protection enabled. For a short test window, an explicitly approved expiring deployment-scoped share link can permit provider requests. Treat the complete link as a credential; do not commit it or include it in logs. Confirm the provider preserves the required query parameter and that unauthenticated POST reaches this exact route. A URL that redirects to Vercel sign-in is not ready to register.

Use a provider delivery-test/replay control if available. Do not initiate another payment merely to test connectivity without separate approval. After testing, remove the diagnostic URL from the provider configuration, revoke its share link, and disable the diagnostic flag. Provider events acknowledged by this diagnostic receiver are not retained for later settlement processing.

Replace the diagnostic URL with the verified-events receiver only after signing configuration, provider reachability and end-to-end processing are tested. Production checkout remains a separate release.
