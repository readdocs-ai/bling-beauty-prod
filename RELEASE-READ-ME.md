# BLING six new original collection concepts

Six newly named BLING-only product concepts replace the earlier manufacturer-branded catalogue on home, shop and individual collection pages. Includes 6 product crops and 6 zoom crops derived from the single AI-generated catalogue. The zooms are NOT independent camera angles. No other brands appear on packaging. All priced £130.

Run SUPABASE-SIX-BLING-PRODUCTS.sql in Supabase SQL Editor after reviewing. This script DEACTIVATES previous product records, does not delete them, and preserves historical order references. It requires an existing UNIQUE constraint on products.slug for ON CONFLICT (slug); if absent, do not run until schema is checked. These are design mock-ups, not real manufactured goods; do not accept orders until supply, contents, labels, claims and product safety are confirmed.

Worldpay: checkout is deliberately disabled; there is no verified payment integration. Official Checkout SDK creates card sessions, then Payments API authorizes them, with 3DS/SCA and payment confirmation. Existing env vars alone do not establish an end-to-end integration. DO NOT ENABLE ORDERING.

Royal Mail: existing API code preserved unchanged. The user's account-side switch to API does not automatically make the website send orders. API import remains disabled in this project until verified payment and measured parcel weights are available.

No live Supabase or Worldpay credentials were used. This is a catalogue update and SQL migration, not a ready-to-launch checkout release.
