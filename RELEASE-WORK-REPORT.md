# Bling Beauty source repair report

## Changes actually made
- Royal Mail Click & Drop payload preparation no longer supplies a fabricated 100 g parcel weight. It requires `parcelWeightGrams` to be an integer measured packed weight (1–30,000 g), and rejects requests without it. Automatic import remains disabled pending confirmed Royal Mail API mapping and the real shipping data.
- The six BLING collection catalogue entries and their twelve existing gallery assets are preserved. No production database, Vercel project or Royal Mail account has been modified.

## Verification
- `npm ci --offline --no-audit --no-fund` was attempted, but failed because the package cache does not contain `zod-3.25.76.tgz`. Thus a Next.js build has not been verified in this environment.
- Worldpay Try checkout is not implemented; the checkout route remains fail-closed (503). This release must NOT be deployed as a payment-ready site.

## Before live transactions
- Confirm Worldpay Access API payment method and authentication requirements against the account, implement server-side payment processing and verification, and test in Try.
- Confirm database migrations for verified payment metadata, then wire paid-order emails and Royal Mail import with idempotency.
- Confirm real physical products and measured parcel weights; existing BLING gallery artwork depicts product concepts.
