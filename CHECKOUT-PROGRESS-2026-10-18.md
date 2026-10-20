# Checkout implementation checkpoint — not launch-ready

Based on uploaded bling-beauty-source-repair-verified (2).zip and the previous Worldpay checkout implementation.

Changes in this checkpoint:
- Worldpay redirect URLs are restricted to HTTPS Worldpay domains (prevents redirect to arbitrary URL supplied by payment response).
- Supports a redirect URL in response `url`, `_links.redirect.href` or `_links.paymentPage.href`.
- Fails closed if pending checkout state cannot be updated in Supabase before redirect.

Unfinished: independent verified payment status / authenticated Worldpay event ingestion, paid-order creation, Resend and Royal Mail triggers, test deployment, integration tests.

Worldpay entity configured in Vercel Preview: PO4101315139. Keep store_settings.orders_suspended=true until payment verification and tests pass. Worldpay Try must not be presented as live card acceptance.

The build has NOT been verified in this environment; dependency installation is unavailable offline. Do not deploy this checkpoint as a release.
