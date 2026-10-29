# Bling Beauty Royal Mail Click & Drop — 29 October 2026

## Current implementation

The original adapter only prepared an incomplete payload and threw instead of importing. This change adds an admin-driven draft-order import and read-only recovery/tracking check for `bling_paid_orders`.

- Requires a verified **Live** paid Worldpay order, its saved provider event/payment identifiers, and a signed admin session plus same-origin POST.
- Staff enter the measured packed weight, actual included tax and actual parcel format for each order. No default weight or VAT rate is invented.
- Only ordinary domestic GB addresses are handled. Northern Ireland, Channel Islands and Isle of Man require manual Royal Mail processing because this integration does not collect the additional customs details.
- Correct documented payload: `{items:[...]}`, explicit `sender.tradingName: "Bling Beauty Products"`, order date, subtotal, included order tax, free shipping charge, total, GBP currency and a package with measured weight/format.
- The checkout's UUID reference is converted deterministically to `BLING-` plus its 32 UUID hex digits. The resulting 38-character reference fits Royal Mail's 40-character limit and remains unique per Bling checkout.
- The existing shared account and its Reta40/default trading name are not modified. The API calls never change integration, sender or account settings.
- Read-only `/carriers` lookup verifies the key and selects the account's sole carrier. If more than one is returned, set `ROYAL_MAIL_CARRIER_NAME` to the exact intended account carrier; no carrier is guessed.
- A durable database claim reserves the import once. A provider lookup checks the exact quoted reference before one create-order POST. Timeouts and ambiguous responses never automatically repeat that POST.
- “Check existing import / update tracking” only queries Royal Mail and saves the matched identifier/tracking. It can recover a provider success whose response or local persistence was interrupted. No match or a conflicting identifier requires manual review.
- No labels, postage services, manifests, order deletions or account-setting changes are requested. Staff apply postage and print labels in Click & Drop, checking sender, actual dimensions, recipient and service first. Existing Click & Drop account automation rules remain controlled by the account owner.
- Tracking and Royal Mail's reported shipped timestamp are persisted when supplied. No customer dispatch email is sent by this change; the existing paid-order customer/admin email jobs remain separate.

## Production setup

`ROYAL_MAIL_CLICK_DROP_API_KEY` now targets Production and Preview. `BLING_ROYAL_MAIL_IMPORT_ENABLED=true` enables only the authenticated per-order draft action; it is not an automatic paid-order shipping worker. `ROYAL_MAIL_CARRIER_NAME` is needed only when the account has multiple carriers.

The additive migration `20261029055924_royal_mail_owned_import.sql` adds private shipping state and two `SECURITY INVOKER` RPCs. Execute permissions are restricted to `service_role`; anonymous/authenticated callers cannot reserve or finish imports. No existing paid order or shipping job was modified during development.

## Verification and limits

33 executable test files passed, including the actual adapter and worker with synthetic provider/database boundaries. TypeScript and the production build passed. The separate SQL transaction in `supabase/tests-royal-mail-owned-import.sql` passed against the database: it checks rejection of Try orders, invalid weight/reference, duplicate claims, wrong completion claims, identifier/tracking conflicts, successful completion and tracking persistence. All synthetic records roll back. Verified remaining paid-order/shipping-job counts: zero.

A real account connection check is available at `/admin/shipping`. A successful read-only check establishes key/account API access; it does not by itself prove an order import, trading-name match or label printing. No real customer order or postage has been created during implementation. The first real import must be tested on a genuine verified paid order once Worldpay's payment flow is ready.

## Admin workflow

1. Open `/admin/shipping` and run **Check Royal Mail connection (read-only)**.
2. Open a verified Live paid order from the shipping list or `/admin/orders`.
3. Pack the parcel, measure weight and confirm the tax amount and parcel format.
4. Click **Create Royal Mail draft once** and verify the stored Royal Mail identifier.
5. Check the draft in Click & Drop, apply the correct postage and print there.
6. Use **Check existing import / update tracking** to bring tracking back to Bling admin.

For any ambiguous import, use the existing-order check instead of creating a second draft. Never reset the durable import claim without investigating Click & Drop first.

## Official contract used

- https://api.parcel.royalmail.com/doc/v1/click-and-drop-api-v1.yaml
- https://help.parcel.royalmail.com/hc/en-gb/articles/360011462338-Integrating-with-the-Click-Drop-API

## Connection diagnostic follow-up

The first user connection check reached the provider response validator but reported the combined empty/invalid carrier error. Separate empty arrays (authenticated HTTP success, no account carriers returned) from malformed responses. Superseded by the OLP correction below: an empty carrier list is not itself an import failure. The admin dashboard now links directly to shipping. Live carrier availability and first draft import remain unverified.

## OLP draft carrier correction

User screenshots confirm Royal Mail OLP services and no separate Shipping carriers setting. The live read-only check successfully returned an empty carrier array. Royal Mail documentation requires carrierName for multi-carrier accounts, not every draft. Empty lists now omit postageDetails entirely and leave the draft carrier/service choice to Click & Drop. A single listed carrier is selected as before; multiple carriers or an explicitly configured unmatched carrier still block before claim. No postage service, labels, manifests or account settings are requested. Synthetic transport tests cover OLP draft creation with no carrier, multi-carrier ambiguity, unmatched configuration and forbidden service fields. First genuine paid-order import remains untested.
