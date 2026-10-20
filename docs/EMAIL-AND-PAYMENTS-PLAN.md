# Bling Beauty — payment and email readiness

## Payment safety
- Checkout is deliberately disabled (HTTP 503) until Worldpay test API credentials, merchant configuration and API access are confirmed.
- HPP Designer returned HTTP 400 and live Worldpay tools were unavailable in the merchant dashboard on 17 October 2026.
- Access Checkout SDK by itself is not a payment authorisation API. The backend payment method must be confirmed against the actual Worldpay account and official API documentation before implementation.
- Never put Worldpay secret credentials in source code or NEXT_PUBLIC_ environment variables.
- An order must be marked paid only after server-side confirmation of a successful authorised/captured payment. Never trust the success return page.
- Test mode must not dispatch goods or send live payment-confirmation emails.

## Email sender setup
- Proposed sender: info@blingbeautyproducts.com. Verify ownership with a transactional email provider and configure SPF/DKIM/DMARC.
- Required templates: order received (unpaid), payment confirmed (verified), dispatch notice (staff action), internal new-order alert.
- Do not send order-received emails before a real persisted order exists.
- Do not send payment-confirmed emails before verified server-side payment confirmation.
- No email sending is enabled in this package: provider credentials and live orders schema have not been verified.

## Admin orders
- Orders table column names have not been verified against the user's live Supabase instance.
- Read-only orders view and CSV export show at most the most recent 500 rows.
- CSV is restricted by admin middleware, protects against spreadsheet formula injection and excludes unknown/sensitive columns.
- CSV is not a complete customer backup or a substitute for a database export.
- Before adding fulfilment status updates, confirm exact schema and business rules.

## Go-live checklist
1. Confirm brand/product photo permissions, inventory and selling prices.
2. Confirm Worldpay account activation and API integration path.
3. Configure verified email sender and webhook signing/verification.
4. Run build and browser tests, payment success/failure tests and order persistence tests.
5. Get explicit approval before deploying or enabling live checkout.
