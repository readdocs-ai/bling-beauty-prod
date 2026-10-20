# Worldpay Preview secure-session handoff checkpoint

This package adds a Preview-only, admin-protected endpoint `/admin/api/worldpay-session-check` and immediately sends the Worldpay Try SDK session result to it.

**No authorisation or payment is performed.** The endpoint validates the presence and format of a session and returns a non-payment acknowledgement; it does not store, log or echo the session. This does NOT prove the Card Payments API can authorise a charge.

Deploy to Vercel **Preview only**, sign in as admin, open `/admin/worldpay-sdk-test`, generate a session with an official Worldpay test card, and check for `Secure session reached BLING server successfully`.

Production remains suspended. Do not turn off the database ordering suspension. HPP unchanged.

Before real payment authorisation: verify Worldpay Card Payments API request contract, 3DS configuration, amount and order binding, idempotency, transaction status verification, and secure finalisation. Do not interpret HTTP 201 from session endpoints as a payment.

This archive has been syntax-checked by inspection and ZIP verified; no full Next.js build was run.
