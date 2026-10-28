# Worldpay automatic settlement checkpoint — 28 October 2026

Status: tested implementation prepared; remote migration, branch publication and activation awaiting explicit approval. Production ordering remains suspended. No new Worldpay transaction or email was submitted during this checkpoint.

## Changes

- Store each new attempt's settlement mode on the server. The default is manual; an explicit Preview-only auto-settlement flag selects automatic settlement for new attempts.
- Build instruction.settlement.auto=true from the claimed database row. Keep integrated 3DS, server-held amount/currency and default Worldpay AVS/CVC cancellation checks.
- Block the separate manual capture in the UI, server coordinator and atomic database claim when the attempt uses automatic settlement. Existing attempts keep the original manual policy and their existing locks.
- For automatic attempts, allow the settlement worker to bind the independently matched Worldpay payment ID once, while processing an authenticated signed settled event. A different stored ID, environment, reference, amount or currency remains rejected. Authorisation and sent-for-settlement still cannot create a paid order.
- Rotate deferred receipts behind unchecked receipts during recovery, so a few unresolved entries cannot block all later orders.
- Show the automatic-settlement configuration in admin checkout operations.

## Database migration

supabase/migrations/20261028192118_worldpay_auto_settlement.sql adds settlement_mode to attempts (existing/default manual) and last_checked_at to the private settlement inbox, and updates two existing service-role-only SECURITY INVOKER functions. No existing attempt is captured, finalised or retried by the migration.

The installed definitions of both affected functions were compared against the previous source checkpoint and match. Automatic approval review rejected applying the new migration because broad project authority was insufficient for this specific persistent database/payment-behaviour change. No migration was applied, no flag enabled and no deployment containing this code was published.

## Validation

- 26 Node test files pass, including the extended payment payload, capture denial and signed-settlement matching cases.
- SQL executed in disposable PGlite PostgreSQL: role restrictions, cross-environment/hash/amount/claim rejection, idempotent finalisation and jobs, automatic-mode manual-capture denial, one-time provider-ID binding and fair receipt rotation pass. These are synthetic fixtures, not actual provider settlement evidence or multi-session contention tests.
- Production build succeeds with placeholder Supabase configuration.
- Five simulated Chromium scenarios pass: successful challenge, initiation/device/challenge network failures, and automatic mode after reload with no manual-capture button. No external provider or mail requests are allowed in this suite.
- npm audit reports zero vulnerabilities at this checkpoint.

## Next authorised execution package

After explicit approval: apply this migration, publish the changes to the existing review branch, enable BLING_PREVIEW_AUTO_SETTLEMENT only for that branch's Preview and run one fresh Worldpay Try bank-challenge test with automatic settlement. Do not touch the earlier captured attempt. Restore any temporary Preview protection exception afterwards.

## Remaining production work

The actual signed settled-event flow and automatic order notifications remain unverified. Worldpay event signing keys and account-side event delivery are still missing. A provider-generated signed event must be matched independently before paid status and queued customer/admin notifications can be claimed tested. Never use synthetic evidence in the connected store.

Production Access checkout routes and Live credentials/environment isolation, unattended recovery, refunds/failures, stock and operational checks, and a separately approved controlled Live card test still need completion. The old HPP production checkout must not be enabled for launch.

Official contract: https://docs.worldpay.com/access/products/payments/enable-features/auto-settlement
