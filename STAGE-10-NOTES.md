# Stage 10 — admin launch-readiness checks

- Added protected `/admin/readiness` showing presence/absence (never values) of essential Supabase and admin environment variables.
- Linked the readiness page from the admin dashboard.
- Explicitly flags checkout as blocked pending live Worldpay activation, verified server-side payments and webhook testing.
- No secrets are shown, no email is sent, no orders are changed, and no payments are accepted.
- This is a configuration-presence check, **not** a live connectivity or security audit.
- Still required: verify real Supabase schema, implement Worldpay integration and email provider, complete build and end-to-end testing.
