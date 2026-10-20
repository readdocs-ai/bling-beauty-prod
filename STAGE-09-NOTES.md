# Stage 09 — transactional email templates and admin previews

- Added typed plain-text email templates for order received, verified payment, dispatch and internal order alerts.
- Added protected `/admin/email-preview` with fictional sample data and a dashboard link.
- **No sending integration has been enabled.** No real order is queried or modified by the preview.
- Order received explicitly says payment is not confirmed; payment confirmed requires verified server-side confirmation; dispatch requires staff action.
- Before enabling delivery: verify domain/SPF/DKIM, choose provider, confirm real Supabase order schema, implement idempotent sends and test in a staging environment.
- Worldpay checkout remains disabled. Do not deploy until build, integration and operational checks pass.
