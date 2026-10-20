# Stage 13 — Royal Mail integration alignment

Reference-only source: Peptide Products `src.zip`, provided by the owner. This is not the latest Peptide Products code and is not used as the Bling Beauty project base.

## Confirmed
- Peptide Products' working integration is Royal Mail **Click & Drop Public API v1** (`https://api.parcel.royalmail.com/api/v1`).
- It authenticates with the server-side `ROYAL_MAIL_CLICK_DROP_API_KEY` environment variable (Authorization header).
- It imports orders, checks existing Royal Mail orders, and saves tracking details in its own order storage.

## Corrected in Bling Beauty
- The shipping admin page previously described an unrelated client-ID/client-secret setup. It now checks the Click & Drop key actually used by the reference implementation.
- No credentials, account numbers, sender addresses or customer records were copied from Peptide Products.
- Live label creation remains disabled.

## Required before enabling labels
1. Inspect actual Supabase orders table fields and add dedicated shipping-reference storage and unique constraints.
2. Map address fields safely, validate UK/international delivery, and use a distinct `BB-` reference namespace.
3. Implement idempotent label creation and recovery after network timeouts; a list of the most recent 100 Royal Mail orders is not sufficient to guarantee absence of duplicates.
4. Confirm verified payment, correct sender identity and account permissions.
5. Test with an authorised non-billable setup or explicit owner approval before creating live postage.

Do not deploy this development checkpoint as a completed Royal Mail integration.
