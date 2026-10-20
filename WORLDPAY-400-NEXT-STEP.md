# Worldpay HPP HTTP 400 follow-up

The checkout API now returns HTTP 200 and redirects to `payments-test.worldpay.com`, where Worldpay responds with HTTP 400. This is **not** a verified payment.

## Changes
- Cart pending button resets on browser focus/pageshow, including when returning from Worldpay.
- Server logs safe HPP destination host, path, link source and transaction reference on successful setup. It never logs the payment URL query string, authentication, or customer details.

## Test
1. Build and deploy to Vercel **Preview**, not Production.
2. Attempt one Try checkout.
3. Find `Worldpay HPP setup accepted` in the matching Vercel deployment logs.
4. Share the destination host, path, and redirectSource fields (no URL query string).
5. If Worldpay still returns HTTP 400, provide the transaction reference to Worldpay support and ask them to investigate the rejected hosted payment session.

These diagnostics do **not** themselves fix a Worldpay-side HTTP 400. Never mark a checkout paid until server-side verification succeeds.
