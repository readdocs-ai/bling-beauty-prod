# Stage 12 — Royal Mail account-switch readiness

- Added `/admin/shipping`, a read-only configuration and safety overview.
- Linked the shipping page from admin readiness and order details.
- Uses only presence checks for optional server-side Royal Mail environment variables; never exposes secrets.
- The existing Royal Mail business account will be used temporarily, then changed to a Bling Beauty account when approved.
- **No Royal Mail API calls, labels, tracking updates, or postage charges are implemented in this stage.**
- Next: confirm API product/version and credentials from the existing account, verify service permissions and sender details, map the actual Supabase orders schema, implement idempotent label creation and tracking persistence, then test against the provider sandbox.
- Do not deploy as production-ready. Worldpay and email integrations remain incomplete.
