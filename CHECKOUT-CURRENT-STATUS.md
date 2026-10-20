# Checkout checkpoint (not launch-ready)

Implemented: validated customer/shipping fields, server-side GBP basket pricing, Supabase pending checkout persistence, Worldpay HPP initiation, strict HTTPS Worldpay redirect allowlist, and configured HTTPS return URL origin.

Required before testing: Supabase `bling_checkout_attempts` migration, Preview `NEXT_PUBLIC_SITE_URL` set to the actual Preview URL, Worldpay credentials and `WORLDPAY_ENTITY`, and an unsuspended test environment.

Not implemented: authenticated Worldpay event verification / payment query reconciliation; atomic transition from paid attempt to order; verified-order Resend delivery; Royal Mail order import. Do not remove the orders suspension, assume a redirect is proof of payment, or deploy to Production yet.

Worldpay API endpoint and HPP response schema must be confirmed with an actual Try response. No live payment test has been performed.
