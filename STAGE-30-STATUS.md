# Bling Beauty — Stage 30 inspection and implementation status

## Confirmed from the uploaded Package 29
- Checkout route is a deliberate HTTP 503 placeholder; there is no working Worldpay payment initiation or verification.
- The `orders_suspended` database switch fails closed.
- Resend transport and verified-order email reservation exist but are not wired to a payment event.
- Six catalogue entries are priced at £130. Their real product images are not present in the project.
- Royal Mail Click & Drop integration code was absent.

## Changes in this working copy
- Added `lib/royal-mail-click-drop.ts`: typed Bling Beauty shipping-order validation and an explicitly disabled import boundary. No shipping label purchase and no automatic import occurs. Weight is deliberately marked a placeholder and must be measured before import is activated.
- Removed the unverified `WORLDPAY_ENTITY` variable from the *readiness check only*. This does not establish that Worldpay checkout is configured or operational.

## NOT COMPLETED — DO NOT DEPLOY AS A LAUNCH RELEASE
1. Download, inspect, and license/approve accurate image files for all six editions, then update Supabase product `images` and verify galleries.
2. Implement Worldpay Access Checkout integration with the exact account-specific flow and server-side payment verification.
3. Apply/reconcile Supabase order migrations against the actual existing orders schema, then test pending/paid transitions and idempotency.
4. Wire Resend to independently verified paid orders and test both customer and business deliveries.
5. Validate Royal Mail API import schema and trading-name routing with a safe test order; use actual parcel weights; never buy postage automatically.
6. Install dependencies, run production build, test the complete Try-mode journey, and confirm the admin suspension remains effective.

No secrets are included. Existing live website is unchanged.
