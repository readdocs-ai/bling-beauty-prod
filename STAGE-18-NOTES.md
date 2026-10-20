# Stage 18 — email transport groundwork

- Added `lib/email/send.ts`, a server-only Resend REST API transport that reuses the existing transactional email templates.
- Uses `RESEND_API_KEY` from server environment, with a fixed sender of `Bling Beauty Products <info@blingbeautyproducts.com>`.
- Validates recipient format, rejects missing configuration, uses a 15-second timeout and does not expose API responses or credentials to the browser.
- This module is **not yet wired to order lifecycle events**. No emails are automatically sent by this change.
- The sender domain must be verified in Resend and a test email must be sent before launch.
- Payment confirmation email must only be triggered after a verified Worldpay event. Dispatch email must only be triggered after a successful Royal Mail label/dispatch action.
- No Worldpay integration, Royal Mail label creation, or Supabase database migration was completed in this stage.
