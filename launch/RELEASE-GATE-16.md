# Bling Beauty — launch gate 16

## Completed in this checkpoint
- Created a six-product CSV review sheet from the actual luxury catalogue, with all prices set to GBP 130.00.
- Products remain inactive in the review sheet until real stock, exact SKU/contents, image usage and Supabase schema are confirmed. This sheet has NOT been imported into Supabase.
- Rechecked the checkout route: it still intentionally returns HTTP 503; it is not a Worldpay integration.

## Outstanding blockers (must not deploy as live checkout)
1. Worldpay Access test credentials and live merchant activation; implement verified server-side payments and test all outcomes.
2. Supabase table/schema validation, then import and enable the six real products.
3. Verify genuine product imagery and actual stock.
4. Configure and test transactional email delivery.
5. Adapt Click & Drop API to Bling order IDs, verify shipping sender and duplicate-label prevention.
6. Complete `npm ci` and `npm run build`, followed by browser and end-to-end tests.

## Build attempt
An npm dependency installation was attempted in this environment but exceeded the available execution time; there is no verified production build.

## Security
Never put API secrets in ZIP archives. Do not turn on a payment button until the payment verification path is tested.
