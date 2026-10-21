# Worldpay Try authorisation checkpoint

Preview only. Test route: `/admin/api/worldpay-try-authorise`. No production or checkout route modifications.

- Fixed GBP 1.00 authorisation-only request (`requestAutoSettlement.enabled=false`).
- Explicit UI checkbox, unique transaction reference, SDK one-time card session.
- Requires Vercel Preview, non-live Worldpay setting, admin middleware session, same-origin HTTPS, configured Try credentials.
- Does not create orders, settle/capture, send email or bypass the suspended-orders switch.
- Worldpay 3DS is **not** implemented. Do not use as a production checkout.
- A serverless deployment cannot guarantee request deduplication without durable storage. Do not retry uncertain requests; check Worldpay using the reference.
- Upstream response bodies and card session strings are never returned or logged.
- Build locally with `npm install` and `npm run build` before pushing the testing branch.
- If Worldpay returns 400/403, inspect status and WP correlation ID without exposing credentials or card details.
