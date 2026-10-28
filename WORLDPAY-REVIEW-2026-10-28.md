# Worldpay automatic settlement checkpoint — 28 October 2026

Status: migration applied and implementation published to the existing review branch, with automatic settlement enabled only for that branch's Preview. One new Worldpay Try bank-challenge payment reached settlement_requested. Production ordering remains suspended. No order notification was sent by this test.

## Changes

- Store each new attempt's settlement mode on the server. The default is manual; an explicit Preview-only auto-settlement flag selects automatic settlement for new attempts.
- Build instruction.settlement.auto=true from the claimed database row. Keep integrated 3DS, server-held amount/currency and default Worldpay AVS/CVC cancellation checks.
- Block the separate manual capture in the UI, server coordinator and atomic database claim when the attempt uses automatic settlement. Existing attempts keep the original manual policy and their existing locks.
- For automatic attempts, allow the settlement worker to bind the independently matched Worldpay payment ID once, while processing an authenticated signed settled event. A different stored ID, environment, reference, amount or currency remains rejected. Authorisation and sent-for-settlement still cannot create a paid order.
- Rotate deferred receipts behind unchecked receipts during recovery, so a few unresolved entries cannot block all later orders.
- Show the automatic-settlement configuration in admin checkout operations.

## Database migration

supabase/migrations/20261028192118_worldpay_auto_settlement.sql adds settlement_mode to attempts (existing/default manual) and last_checked_at to the private settlement inbox, and updates two existing service-role-only SECURITY INVOKER functions. No existing attempt is captured, finalised or retried by the migration.

Before applying the migration, the installed definitions of both affected functions were compared against the previous source checkpoint and matched. After explicit approval for the three execution steps, the migration was applied and service-only permissions verified. Existing attempts retain manual mode and their existing locks.

## Validation

- 26 Node test files pass, including the extended payment payload, capture denial and signed-settlement matching cases.
- SQL executed in disposable PGlite PostgreSQL: role restrictions, cross-environment/hash/amount/claim rejection, idempotent finalisation and jobs, automatic-mode manual-capture denial, one-time provider-ID binding and fair receipt rotation pass. These are synthetic fixtures, not actual provider settlement evidence or multi-session contention tests.
- Production build succeeds with placeholder Supabase configuration.
- Five simulated Chromium scenarios pass: successful challenge, initiation/device/challenge network failures, and automatic mode after reload with no manual-capture button. No external provider or mail requests are allowed in this suite.
- npm audit reports zero vulnerabilities at this checkpoint.

## Actual Worldpay Try verification

- Verified the Ready Preview deployment uses the automatic-settlement implementation and branch-scoped configuration.
- Prepared one new GBP 130.00 attempt with synthetic customer details and an official Worldpay Try challenge card. The user performed payment submission and completed the simulated bank challenge.
- The real provider flow advanced through device data and issuer challenge to settlement_requested with server-stored settlement_mode=auto and payment_environment=try. No separate manual capture was invoked; the earlier captured attempt was untouched.
- An independent read-only Worldpay query remained pending and required verified settlement. Local status correctly remains payment_processing; no paid order was created. This is provider initiation/3DS/automatic-settlement-request evidence, not evidence that funds settled.
- The temporary test-alias protection override was revoked and its empty protectionBypass configuration verified after the callback completed.
- Production ordering remains suspended. The connected settlement inbox and paid-order tables still have no receipts or paid orders at this checkpoint.

## Remaining production work

The actual signed settled-event flow and automatic order notifications remain unverified. Worldpay event signing keys and account-side event delivery are still missing. A provider-generated signed event must be matched independently before paid status and queued customer/admin notifications can be claimed tested. Never use synthetic evidence in the connected store.

Production Access checkout routes and Live credentials/environment isolation, unattended recovery, refunds/failures, stock and operational checks, and a separately approved controlled Live card test still need completion. The old HPP production checkout must not be enabled for launch.

Official contract: https://docs.worldpay.com/access/products/payments/enable-features/auto-settlement
