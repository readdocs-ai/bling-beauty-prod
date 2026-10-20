# Bling Beauty — release gate and implementation audit (17 October 2026)

This package is NOT a live-release candidate. No live payment endpoint has been enabled.

## Verified from the current project source
- The six luxury collection entries are preview-only (`lib/luxury-catalogue.ts`, `app/luxury/[slug]/page.tsx`). They are NOT purchasable Supabase products; one has no reference price, and all lack confirmed actual sale prices, inventory, and product photographs.
- `app/api/checkout/route.ts` intentionally returns HTTP 503. There is NO working Worldpay integration. Do not enable purchase buttons that imply payment works.
- Royal Mail Click & Drop reference implementation is known from the supplied Peptide Products `src.zip`, but Bling Beauty does not yet create labels. Its own orders schema and sender configuration must be checked before writing a shipping adapter.
- Email templates exist, but no transactional email delivery has been configured or verified.
- Admin order screens have been added but not validated against the live Supabase schema.
- No production build or end-to-end payment test has been verified in this release.

## Change in this checkpoint
- Fixed cart persistence startup ordering: initial empty-cart render no longer overwrites a saved basket before it has been read. Invalid stored items are ignored and restored quantities are capped.

## Minimum inputs and go-live requirements
1. Confirm each of the six actual SKUs, final selling price, stock availability, exact contents and images permitted for use. Avoid substituting brand reference prices for actual sale prices.
2. Verify Supabase products/orders schemas in a safe staging environment and ensure prices, totals and stock are verified on the server, never trusted from the browser basket.
3. Obtain Worldpay Access API test credentials via secure environment configuration, implement payment-session/tokenization and verified payment result handling against current Worldpay documentation; test authorisation, refusal, duplicate webhook and abandoned checkout. Live credentials must be enabled by Worldpay before live release.
4. Configure transactional email provider and verified sending domain; test delivery and suppression of duplicate confirmations.
5. Configure Royal Mail Click & Drop using server-side credentials and correct Bling Beauty sender identity; implement idempotent label creation and tracking storage, and test without unintended postage purchases.
6. Run npm install/npm run build and browser QA on desktop and mobile, plus admin security checks. Deploy to Vercel preview first, then live only with owner approval.

Never include secrets in a ZIP or send them through chat. Historical Stripe records should remain available for reconciliation even if checkout code is removed.
