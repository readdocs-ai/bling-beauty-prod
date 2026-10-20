# Stage 28: Verified-payment email delivery groundwork

Added `lib/email/verified-order.ts` and `supabase/email-delivery-log.sql`.

- Rechecks order paid state, Worldpay provider, verified timestamp and customer email server-side before sending a paid-order notification.
- Uses a unique per-order/per-email-type reservation to prevent duplicate sends from concurrent callbacks.
- Keeps email sending separate from payment state; email failure cannot mark an order unpaid.
- Delivery failures remain recorded as `failed`. Do NOT automatically retry until an explicit reconciliation procedure is designed, because a network failure can occur after Resend accepts an email.
- This module is **not yet connected to checkout or webhook**. It requires the order migration and the email-delivery-log migration; neither has been run by this package.
- No Worldpay payment endpoint has been implemented or tested. Production checkout stays disabled.
- This package has NOT passed a production build or live test. Do not deploy.
