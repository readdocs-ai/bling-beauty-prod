# Worldpay migration status

Live mode is not available in the merchant dashboard. Checkout deliberately returns HTTP 503 and never charges a card. Do not enable live orders until merchant activation, API integration, server-side amount validation, webhook authenticity verification, end-to-end test payments and refunds have passed.

Historical Stripe-related columns and order records in Supabase must be retained for reconciliation; they are not used for new purchases. No Worldpay secrets are included in this ZIP.

Email templates and order workflows require confirmed Supabase orders schema and an email delivery provider. Contact links use info@blingbeautyproducts.com.
