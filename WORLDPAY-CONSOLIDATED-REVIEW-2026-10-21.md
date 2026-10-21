# BLING Worldpay review and preview-only diagnostic update — 21 October 2026

**Status: NOT READY FOR LIVE ORDERS.** This is a source package, not a verified working Worldpay checkout. Do not deploy to production or change `orders_suspended=true`.

## Source inspection
- Branch baseline `b775319` (`worldpay-testing`). The uploaded archive includes uncommitted `.gitignore`, SVG branding and product CSV changes. Those files have been preserved, not discarded.
- The Worldpay Try SDK test generates a card session and the separate `/admin/api/worldpay-session-check` accepts it. This is not a payment authorisation.
- The Try authorisation request reached Worldpay and returned HTTP 400, which the server reported as 502. The actual upstream error category was not visible in the previous UI. The exact root cause is **not established**.
- The customer checkout still uses Worldpay Hosted Payment Pages; the SDK test is not wired to that checkout. No end-to-end 3DS/SCA, settlement and order verification test is proven.
- Paid-order tables and finalisation SQL are present, but presence does not prove migrations were applied to Supabase. Payment-query assumptions and email jobs require testing.

## Changes in this package
1. Try authorisation route requires `VERCEL_ENV=preview` and explicit `WORLDPAY_ENVIRONMENT=try` (not merely anything other than `live`).
2. Validates the submitted one-use session as an HTTPS Try Worldpay session URL; rejects cross-host sessions without logging them.
3. Exposes only tightly allowlisted provider error names, error codes and validation **field names**, never provider messages, card details or tokens, to make the 400 diagnosable.
4. Admin SDK test displays these safe provider diagnostics after the next single Try attempt.
5. Session handoff test now handles malformed Origin without throwing and requires explicit Try mode.

## Important limitations and remaining release gates
1. Set `WORLDPAY_ENVIRONMENT=try` **only on Preview** and verify Try username/password/entity scope, without sharing values. The new route refuses to run if the variable is absent.
2. Deploy this update to `worldpay-testing` Preview only. Perform **one** new test-card authorisation. Record the HTTP status, safe provider error name/code, validation field names and WP correlation ID. Never reuse a card session.
3. Confirm exact merchant API entitlements and fix any Worldpay validation failure. A successful Try authorisation must be demonstrated, not assumed.
4. Choose the customer checkout architecture: finish Hosted Payment Pages if supported by the merchant account, or replace it with a properly integrated Checkout SDK/Payments flow. Do not silently mix both.
5. Implement/test 3DS/SCA, refusal/cancellation/timeout handling, duplicate submits, idempotency and safe retry. Confirm capture/settlement policy.
6. Validate authoritative payment query or signed webhook responses against actual Worldpay response shape, then validate Supabase finalisation SQL, stock/order totals, paid-order records and email jobs on a test database.
7. Review npm audit findings, auth protection, live/preview environment isolation, credentials and security logging.
8. After successful end-to-end Try tests, verify Live Worldpay merchant enablement, then perform a controlled live test only with explicit approval.
9. Only after go-live approval: backup, deploy reviewed code to production, verify monitoring and manually change the database `orders_suspended` switch. Keep a rollback plan.

## Validation
Static code review completed. An attempted dependency installation in the review environment timed out, so **a full build and live provider integration test have not been completed here**. Run `npm ci` and `npm run build` on the correct Windows project before any Preview deployment. Do not run `npm audit fix --force` blindly.

Official references: https://docs.worldpay.com/access/products/card-payments/authorize-a-payment and https://docs.worldpay.com/access/products/card-payments/v7-migration-guide
