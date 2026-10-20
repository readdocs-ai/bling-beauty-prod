# Package 27 — guarded Resend smoke test

Adds /admin/email-test and /admin/api/email-test, protected by existing /admin middleware and restricted to Vercel Preview. The endpoint uses the existing Resend transport and sends a fixed, explicitly labelled test admin email to info@blingbeautyproducts.com. No order is created, no payment is initiated, and the live ordering switch is untouched.

Requirements for Preview: RESEND_API_KEY, ADMIN_USERNAME, ADMIN_PASSWORD. The domain blingbeautyproducts.com must be verified in Resend. Do not put secrets in chat.

Not implemented: Worldpay payment processing, order lifecycle, idempotent email triggers, Royal Mail label generation. Do not deploy to production or enable ordering. Resend acceptance does not guarantee inbox delivery; check Resend Logs and inbox.
