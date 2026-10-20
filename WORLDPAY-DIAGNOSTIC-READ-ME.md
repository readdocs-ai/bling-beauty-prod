# Worldpay Try diagnostic correction — 18 October 2026

This package contains the full uploaded project with two targeted changes:

1. Checkout trims accidental whitespace around the Worldpay environment values, and logs the provider HTTP status, safe error type, correlation/request ID (when supplied), environment, and internal reference on failed HPP setup. It does not log passwords or full provider responses.
2. Payment Queries now sends the Worldpay-documented `Accept: application/vnd.worldpay.payment-queries-v1.hal+json`.

Worldpay's HPP endpoint, Basic authentication and HPP media type in the original project already matched Worldpay documentation. A repeated HTTP 401 cannot be reliably repaired by guessing a new API endpoint. It may require Worldpay to enable HPP access or confirm the Try credentials are authorized for this entity.

**Test safely:** deploy this project to Vercel Preview only. Confirm Vercel Preview variables for `WORLDPAY_API_USERNAME`, `WORLDPAY_API_PASSWORD`, `WORLDPAY_ENTITY`, `NEXT_PUBLIC_SITE_URL` / `SITE_URL`, and `WORLDPAY_ENVIRONMENT` (try, not live). Run a single test checkout and inspect the new `/api/checkout` log. Send Worldpay support the HTTP status, error type, request ID, and entity (never your password).

**Important:** The database ordering suspension flag is shared with production. Do not enable live paid orders until stock, real Worldpay acceptance, payment verification, email, and Royal Mail flow are verified. No live payment was made and no production deployment was performed in preparing this package.

Docs: https://docs.worldpay.com/access/products/hosted-payment-pages/setup-a-payment and https://docs.worldpay.com/access/apis
