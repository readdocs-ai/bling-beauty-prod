# Stage 26 — Supabase ordering switch alignment

Corrected the admin switch and server-side ordering checks to use `public.store_settings.orders_suspended`, matching the column the user created in Supabase. Previous packages mistakenly used `ordering_suspended`.

The existing Supabase record is `id=1`, `orders_suspended=true`; do not rerun the migration or resume orders before Worldpay checkout is tested.

The checkout route remains disabled with HTTP 503 even if the switch is resumed. This package does not implement Worldpay transactions, shipping labels or email sending.
