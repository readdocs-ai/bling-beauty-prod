# Bling Beauty WPecom launch checkpoint — 31 October 2026

Repository: readdocs-ai/bling-beauty-prod. Branch: live-worldpay-checkout-20261029.
This change builds on 2dee70f, preserving today's Supabase catalogue and full BLING collection names.

## Implemented

- Access Checkout integrated secure fields remain the payment flow, with automatic settlement, persistent ownership and one-shot payment claims. No HPP checkout is introduced.
- Live WPecom receiver uses the exact Worldpay source allowlist at Vercel's firewall and the Vercel-supplied peer header at the application boundary. Neither arbitrary X-Forwarded-For nor caller-supplied JSON grants trust.
- Only sentForSettlement notifications for the configured merchant, a matching GBP amount, reference and payment ID are candidates for confirmation.
- Payment Queries must independently match reference, entity, currency, amount and payment ID and report settlementRequestSubmitted. Authorization alone or settlementRequested is insufficient.
- A dedicated private database RPC atomically creates one paid order and three durable jobs. The payment_confirmation_stage is settlement_submitted: this does not represent final bank settlement.
- Notification acknowledgement follows durable receipt storage; deferred processing does not delay acknowledgement. Duplicate body hashes are checked and conflicting event reuse is rejected.
- Owner-authenticated status polling can recover a delayed Payment Queries response, throttled to one reservation every 15 seconds per notification. Recovery never starts a charge.
- Live checkout re-reads active Supabase products/prices. Basket price values are never payment authority.
- Legacy signed final-settlement processing remains separate; it cannot consume a WPecom receipt.

## Production database and firewall

The migration 20261031092659_wpecom_verified_capture was applied earlier on 31 October. This commit restores the local migration file from the installed definitions; do not apply it twice.
The confirmation RPC is unavailable to anon/authenticated and executable only by service_role. RLS remains enabled on payment tables.
Vercel project prj_vKaYIX12b5HkowNVMWqQQX1AkspQ has active firewall rule rule_worldpay_webhook_sources_only_wwN9Ud: deny non-Worldpay source IPs only for /api/worldpay/events and /api/worldpay/events/.
Do not disable Preview authentication or change shared Royal Mail account settings.

Production configuration required: WORLDPAY_WEBHOOK_AUTH=worldpay_ip, BLING_WPECOM_FIREWALL_VERIFIED=true, BLING_LIVE_SETTLEMENT_EVENTS=true. VERCEL=1 and VERCEL_ENV=production are platform runtime values.
Enable BLING_LIVE_CHECKOUT_ENABLED and set store_settings.orders_suspended=false only when releasing the tested build for the owner's controlled card test.

## Validation and remaining evidence

Automated tests use synthetic provider/database boundaries except the PGlite tests, which run actual SQL on a local PostgreSQL engine. They do not prove that a real payment or delivery succeeded.
Before declaring the launch complete, verify a genuine Worldpay transaction and trusted notification, one paid order, customer/admin email acceptance and inbox receipt, and one matching Royal Mail draft import.
The owner must enter their own real card and complete bank authentication. Admin email/connection tests require secure admin sign-in. Do not retrieve credentials from configuration or put card/password values in chat.
Confirm the Worldpay dashboard destination is https://blingbeautyproducts.com/api/worldpay/events and sentForSettlement notifications are enabled for the correct Live merchant.
Royal Mail imports are manual verified-order drafts with measured packed weight, parcel format and actual tax; no postage purchase, label generation or manifest is performed by the site.

Sources checked: https://docs.worldpay.com/access/products/hosted-payment-pages/webhooks and https://docs.worldpay.com/access/products/payment-queries/retrieve-by-payment-id . The webhook documentation URL does not change the Access API checkout architecture.

## Live device-data correction

The first Live card attempt reached device_data, but the browser message listener still trusted only the Try Cardinal origin. Live now uses https://centinelapi.cardinalcommerce.com and Try uses https://centinelapistag.cardinalcommerce.com, with exact frame/source and completion checks. New DDC forms also reject a URL from the wrong environment.
For an owned, stalled device_data action, the checkout offers an explicit continuation after the documented 10-second DDC timeout. It sends an empty DDC continuation body using the existing provider action and atomic continuation claim. It does not release the payment claim, submit another card session, create another payment or assert payment success. The bank/Worldpay still determines authentication outcome. If the action expired or a response is uncertain, stop and reconcile; do not restart payment automatically.
Live bank screens omit Preview diagnostics. Invalid-card session failures prompt the customer to check their details; pending preparation is no longer labelled as a submitted payment.
Official reference: https://docs.worldpay.com/access/products/payments/enable-features/3ds-authentication/integrated-3ds/web
