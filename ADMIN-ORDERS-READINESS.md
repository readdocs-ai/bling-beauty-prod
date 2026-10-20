# Admin orders: stage 4

- Dashboard now shows product count and a clearly labelled summary of the eight most recent order records.
- New /admin/orders page offers read-only order listing and local search over the most recent 500 records.
- This does not modify, migrate, or delete customer/order records.
- Column names are based on likely schemas and MUST be reconciled against the actual Supabase orders table before calling the feature complete.
- Missing orders table shows a warning rather than crashing the entire dashboard.
- Sales totals only use total_gbp/total_amount_gbp and recognised paid statuses; they may be incomplete for other schemas.
- No Worldpay test payments or production build have been verified yet. Do not deploy.
