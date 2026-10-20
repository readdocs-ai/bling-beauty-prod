# Stage 25 — UK shipping totals

- The checkout quote and preflight endpoints now return `shippingPence: 0` and `totalPence: subtotalPence` for the validated UK-only basket.
- Server-side catalogue prices and quantity limits remain unchanged.
- Neither endpoint initiates payment or creates an order.
- Live checkout remains disabled until Worldpay test payment initiation, verification, order persistence, and security testing are completed.
- The `store_settings` Supabase table and suspension state must be configured; otherwise quote and preflight fail closed.
- Six Supabase products were confirmed by the user; their exact descriptions/images and alignment with website catalogue require verification.
- Worldpay credentials are configured for Vercel Preview only; `WORLDPAY_ENTITY` and other integration-specific settings may still be required.
