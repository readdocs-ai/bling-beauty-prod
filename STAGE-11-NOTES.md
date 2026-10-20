# Stage 11: safe orders database diagnostic

Added `/admin/database-check` linked from `/admin/readiness`.
- Server-only, admin-middleware-protected, read-only query for up to one `orders` row.
- Reports connectivity status and column *names* only; no customer data, credentials or raw error messages.
- If the table is empty, it cannot discover its column names.
- No schema changes, payment requests or email sends.
- Worldpay remains disabled pending confirmed API access and test credentials.
