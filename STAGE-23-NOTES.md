# Stage 23 — Worldpay integration boundary and deployment check

- Added a server-only Worldpay environment readiness helper (`lib/worldpay-readiness.ts`). It never returns secret values and defaults to Try mode unless `WORLDPAY_ENVIRONMENT=live` is explicitly set.
- Added a public-safe status endpoint at `/api/admin/worldpay-readiness` that exposes **only** whether checkout is available, not credential presence or secret names. (This route is informational and does not require admin authentication.)
- Existing `/api/checkout` remains deliberately blocked. No orders or payments are created.
- Required Worldpay API endpoint/flow and event signature verification are not yet established. Do not invent or call an unverified payment API.
- Next: confirm Worldpay Access integration type and endpoint documentation; implement server-side payment creation, verified callback, idempotent Supabase updates and end-to-end Try mode tests.
- Production build was attempted, but dependency installation timed out in this environment. **Build not verified.**
