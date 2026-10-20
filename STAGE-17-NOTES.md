# Stage 17 — luxury catalogue shopping flow

- Six luxury collection cards now appear on the homepage as well as in the shop.
- Each luxury product detail page has a working Add to Cart control at £130.00.
- Cart item links resolve to luxury detail pages rather than missing standard product URLs.
- Checkout stays disabled (HTTP 503) pending Worldpay live activation and server-side payment integration.
- No Supabase writes, stock changes, orders, payment attempts, or Royal Mail labels occur.
- Product images are placeholders; verify product identity, exact contents, provenance and stock before taking orders.
- Next: verify Supabase schema, implement Worldpay test checkout and payment verification, activate emails and Royal Mail, complete production build.
