# Stage 19 - Supabase luxury catalogue migration prepared

The existing database has `products` and `orders`. Orders RLS was enabled by the owner, and test orders cleared. Product schema includes a legacy `stripe_price_id text not null` field, so the new SQL migration removes only that requirement, preserves the column, deactivates SADOER, and upserts the six luxury listings at GBP 130.

The SQL is **not executed** and no Supabase records have been changed. Review item identity, contents, inventory and image rights before accepting orders. The six items have empty image arrays; accurate product images must be provided before go-live. Shop currently renders both luxury preview tiles and Supabase product cards, so deduplication remains required. Worldpay and shipping integration remain outstanding.
