# Worldpay paid order finalisation - testing status

Implemented: server-to-server payment query; atomic/idempotent paid-order persistence via Supabase RPC; two independent durable email delivery jobs; Royal Mail fulfilment job queued awaiting measured parcel weight; success page requests server verification.

Not tested against live services. No real Worldpay transaction, Resend email or Royal Mail import was performed. Royal Mail import deliberately remains disabled until measured parcel weights and account-specific payload are validated. No live checkout activation is authorised by this package.

Before Preview test: apply supabase/bling-checkout-attempts.sql then supabase/bling-paid-order-finalisation.sql using Supabase SQL Editor; confirm Worldpay Try credentials/entity, Resend key, public site URL, Preview deployment and store switch. Confirm Worldpay query response shape with an actual Try payment. Confirm two delivery jobs are sent once and Royal Mail job is pending. Keep live store suspended until validated.

Security: only Worldpay server query can trigger paid order; customer redirect alone cannot. Provider response validation should be confirmed against real Try payload before launch.
