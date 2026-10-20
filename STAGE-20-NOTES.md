# Stage 20 — New orders suspension control
- Added /admin/order-settings and dashboard shortcut.
- Persistent Supabase store_settings table, row-level security enabled, no public policies.
- Server-side checkout route checks suspension state and fails closed when configuration is missing.
- The existing Worldpay checkout remains disabled regardless of switch state. Turning on orders does NOT enable payments.
- Run supabase/order-switch.sql in Supabase SQL Editor before using the control.
- Dispatch wording: 1–2 working days, subject to availability.
- This is a development package; production build and end-to-end tests remain outstanding.
