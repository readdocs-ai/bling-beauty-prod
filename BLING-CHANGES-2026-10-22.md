# BLING Worldpay source update — 22 October 2026

## Changes made

1. `lib/worldpay-payment-query.ts`: payment verification now fails closed when `WORLDPAY_ENVIRONMENT` is absent or invalid, and production cannot query the Try environment.
2. `app/api/checkout/route.ts`: validates the Worldpay environment before creating a pending checkout attempt, avoiding unusable pending rows for misconfiguration.
3. `app/admin/api/worldpay-try-authorise/route.ts`: expands safe, allowlisted diagnostics for nested provider error codes, without exposing card sessions, credentials or payment data.

## Not completed / launch blockers

- The observed Worldpay `bodyDoesNotMatchSchema` HTTP 400 is **not yet resolved or proven resolved**. The endpoint, v7 media type, and requestAutoSettlement shape agree with Worldpay documentation. The precise rejected field cannot be confirmed without a provider validation response or merchant support. Do not guess and deploy a new payment schema.
- This admin £1 test does not implement the live customer payment journey. Customer checkout uses Worldpay Hosted Payment Pages and needs independent testing, including 3DS, return URLs, and confirmed settlement.
- Verify the merchant entity and permissions, payment-query API access, finalisation, emails, refunds and duplicate-payment protection in Try before enabling production.
- Confirm production credentials and environment scopes without sharing secrets. Keep orders suspended until explicit approval.

## Safe deployment

Apply to `worldpay-testing` only. Run `npm ci`, `npm run build`, test on Preview. Do not merge to main or change `orders_suspended` until end-to-end payment and order tests pass.

Reference: https://docs.worldpay.com/access/products/card-payments/authorize-a-payment
