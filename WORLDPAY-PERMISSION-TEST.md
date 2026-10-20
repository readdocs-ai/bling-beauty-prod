# Worldpay Card Payments read-only permission diagnostic

This package adds **only** `app/admin/api/worldpay-permission-test/route.ts` and this note to the previous safe-redirect diagnostics project. No checkout/payment logic is changed.

## Run
1. Deploy to **Vercel Preview**, not Production. Keep existing Worldpay Try environment variables configured for Preview. Do not generate or share new credentials.
2. Open the Preview deployment, sign in to the existing `/admin/login` page.
3. In the same browser, open `/admin/api/worldpay-permission-test` on the **same Preview hostname**.
4. Send the displayed JSON (no secrets) to ChatGPT.

The endpoint uses **GET** `https://try.access.worldpay.com/cardPayments`, with the documented Card Payments v7 Accept header and existing Worldpay API Basic credentials. No card data, payment authorisation, or customer order is created. It is guarded by existing `/admin` login middleware and refuses to run outside `VERCEL_ENV=preview`.

A 200 from Worldpay indicates discovery access, **not** confirmed permission to charge cards. A 401/403 indicates an authentication or permission problem for that endpoint. A 404/406 may mean the resource/version isn't available to this account; review Worldpay's documentation and account permissions before concluding anything.

Remove this temporary diagnostic route after testing.
