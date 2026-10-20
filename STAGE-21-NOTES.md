# Stage 21 - Order security and integration schema preparation

Prepared an additive Supabase migration at `supabase/worldpay-order-preparation.sql`.

This preserves historical Stripe reference columns for audit, while adding independent Worldpay payment references, verified payment timestamp, line items, fulfilment status, Royal Mail references and tracking, plus uniqueness constraints to reduce duplicate payment-event/label records.

**Not applied to Supabase.** The screenshot confirmed RLS enabled and five test orders removed, but no database changes were made by this package.

**Not implemented:** Worldpay payment creation, verified webhook signature handling, order writes, Click & Drop label generation, sending transactional emails, end-to-end tests or production build. Checkout remains HTTP 503 by design. Do not deploy as a live checkout.

Before live processing: verify Worldpay API product and test credentials, select supported payment integration per official documentation, confirm Supabase orders schema constraints and access control, implement server-side price calculation and payment verification, configure and test webhooks, wire email and Royal Mail with idempotency, then run build and test complete order flow.
