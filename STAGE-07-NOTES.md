# Bling Beauty — Stage 07

## Implemented
- Added a browser Print order control to each admin order detail page, with print-specific styling.
- Expanded existing CSV export to include customer phone and available shipping-address fields.
- Preserved existing order data and all earlier site changes.

## Important limitations
- No Worldpay test payment has been run: credentials and merchant test setup have not been supplied. Checkout still returns HTTP 503.
- Transactional emails remain unconfigured.
- Export covers the latest 500 orders only and only named columns present in the actual table.
- Live Supabase schema has not been checked.
- Build has not been verified in this environment. Do not deploy.
- Product availability, stock provenance and photo licensing must be verified before go-live.

## Needed for completion
- Confirm Worldpay test API integration type and set secret values privately in Vercel.
- Verify Supabase orders table schema and required columns before enabling write actions.
- Configure transactional email provider and verify sender domain.
- Install dependencies and run Next.js build and browser checkout tests.
