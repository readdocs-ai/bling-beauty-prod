# Access checkout production implementation — 29 October 2026

This is the current implementation record. Older stage/readiness notes describe earlier builds.

## Scope and evidence

The owner authorised deploying the Access checkout to the public site on 29 October. The removed `/api/checkout` implementation created hosted payment pages; it now prepares an owned Access Checkout attempt. The card session, 3DS device collection and challenge continue through explicit Live endpoints, using Worldpay Payments API version `2024-06-01`. New Live attempts always request automatic settlement. No browser amount or provider action URL is accepted. A durable, single-use database claim protects every provider POST, including ambiguous timeouts.

The same settlement inbox, paid-order commit and durable customer/admin email jobs support separately configured Try and Live environments. A signed `settled` event and independent query matching the exact reference, GBP amount, entity and payment ID are required before recording a paid order or sending payment-confirmation emails. A settlement request, bank return or success URL alone is insufficient. Customer polling reads owned local state; it cannot trigger a charge or mark an order paid.

29 executable test files cover the retained Try flow and new Live flow. The Live handler test executes preparation, transport, persistence, device data, issuer return, challenge completion, signed notification, query verification, paid-order creation, two separate idempotent email jobs, duplicate notifications, amount mismatch and timeout locks. External services and SQL are simulated in that test: it does **not** prove a real Worldpay settlement or actual inbox delivery.

## Production setup required

Set these under Vercel **Production**, never by replacing Preview test credentials:

| Variable | Requirement |
| --- | --- |
| `WORLDPAY_ENVIRONMENT` | `live` |
| `WORLDPAY_API_USERNAME`, `WORLDPAY_API_PASSWORD` | Live Access API credentials from Worldpay |
| `WORLDPAY_ENTITY` | Live entity provisioned for the merchant |
| `WORLDPAY_CHECKOUT_ID` | Live Checkout SDK ID |
| `WORLDPAY_STATEMENT_NARRATIVE` | Agreed merchant narrative, e.g. `Bling Beauty Products` |
| `NEXT_PUBLIC_SITE_URL` | `https://blingbeautyproducts.com` or `https://www.blingbeautyproducts.com` without trailing slash |
| `WORLDPAY_EVENT_SIGNING_KEYS` | JSON object of numeric key ID to Worldpay's shared HMAC secret; not the API password |
| `BLING_LIVE_SETTLEMENT_EVENTS` | `true` after verified webhook configuration |
| `RESEND_API_KEY` | Server-only key authorised for Production and verified sender domain |
| `BLING_ORDER_EMAILS_ENABLED` | `true` |
| `CRON_SECRET` | Strong random server-only bearer secret for scheduled recovery |
| `BLING_LIVE_CHECKOUT_ENABLED` | `true` only after setup and review |

The existing Supabase URL/service role configuration and admin credentials must also be present. `/api/checkout/config` exposes only environment/availability. The authenticated admin checkout-operations page lists detailed booleans without secret values. The ordering switch remains independently enforced; the authenticated admin may enable it once all Live configuration checks pass. Pausing new orders does not disable an already-running authentication or settlement notification.

Register the Live webhook with Worldpay at `https://blingbeautyproducts.com/api/worldpay/events` and enable signed settlement events. Worldpay's official Events Signature guidance says to contact the Implementation Manager to enable `Event-Signature` and obtain the shared secret. The prior Try delivery test received unsigned `sentForAuthorization`/`authorized` notifications only. Do not enable the old diagnostic receiver or treat those as settlement proof.

## Emails and recovery

Customer: payment-confirmed receipt to the stored checkout email, with products, total and delivery address. Admin: separate verified-paid-order alert to `info@blingbeautyproducts.com`. Sender/reply-to: `info@blingbeautyproducts.com`. Try emails require the existing allowlist and `[TEST]` prefix; Live emails require Production/Live.

Each email has a stable, separate provider idempotency key and durable job claim. Provider acceptance is recorded, not claimed as inbox delivery. Ambiguous sends remain `needs_review`; inspect Resend before manually retrying. A daily authenticated Vercel recovery job and the authenticated admin recovery control revisit durable pending event/email work; they never retry card payments. Daily scheduling fits the existing Hobby plan. The event handler normally processes immediately after durable acknowledgement; recovery is a fallback.

## First real-card test

1. Verify Live access is approved and values above are saved; redeploy with those values.
2. Confirm the public checkout shows Live mode and configuration/ordering checks pass.
3. Account owner submits one real-card payment and completes any bank approval; do not resubmit after an uncertain result.
4. Match the Worldpay amount/reference and settlement event to one paid Supabase order.
5. Confirm exactly one customer and one admin email in Resend and both inboxes, then inspect the admin order details.
6. Test declined/bank-failed and refresh/interruption cases without generating duplicate charges. Cancellation/refunds require a separately verified operational procedure; no refund endpoint is implemented by this change.

If signed settlement is delayed, keep the payment pending and investigate. Do not manually mark a test order paid or fabricate provider evidence to trigger emails. A live transaction and inbox receipt remain unverified until this procedure completes.

## Validation and rollback

Run `npm run test:worldpay`, `npx tsc --noEmit` and `npm run build` with the required database configuration. Local build-only placeholder keys are not deployable credentials; Vercel builds from Git using its own Production variables. Do not upload `.env` files or secrets.

Known prior production deployment: `dpl_4TsgnALgN1rs8NKUEVeGjFv9VQ6o`. Review branch: `live-worldpay-checkout-20261029`, based on `2551061513a502806620e2a9c7bab0ab7c3d53e6`. No old Try attempt is converted into a Live attempt. Browser recovery storage is separate for each environment.

## Official references

- https://docs.worldpay.com/access/products/reference/go-live
- https://docs.worldpay.com/access/products/checkout/web
- https://docs.worldpay.com/access/products/payments
- https://docs.worldpay.com/access/products/events/signature

## Support request and email diagnostic follow-up

Worldpay support case 29407645 was submitted successfully; the portal states a response within 48 hours. The signed Live settlement event secret/key ID remain external requirements. Official Payment Queries documentation says settlement events are not yet available there, so query aggregation is not a verified substitute.

The authenticated `/admin/email-test` control now supports Production/Live as well as Preview/Try. It sends a clearly labelled `[TEST]` transport email only to `info@blingbeautyproducts.com`; it creates no order or payment and makes no paid-order claim. Same-origin POST and a signed admin session are required. A fixed payload and environment-specific hourly provider idempotency key prevent repeated clicks from duplicating the test within the hour. Resend acceptance is distinct from inbox receipt. This does not validate the real paid-order email trigger.
