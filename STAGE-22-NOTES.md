# Stage 22 — server-side basket validation

Added `POST /api/checkout/quote` as a server-authoritative, fail-closed quotation endpoint for the six £130 luxury collections.

- Checks the persistent ordering suspension flag before quoting.
- Rejects unknown products, invalid quantities and duplicate lines that exceed the quantity cap.
- Calculates prices from the server catalogue, never from client-supplied prices.
- Does not collect customer information, create an order, initiate payment or assume shipping is free.
- Returns `paymentEnabled: false` until a separately implemented and verified Worldpay payment flow is available.

**Not a Worldpay integration.** Next tasks: obtain the supported Worldpay Access API integration configuration, implement payment sessions and verified callbacks, verify Supabase schema and transactional email, connect Click & Drop, test and build.
