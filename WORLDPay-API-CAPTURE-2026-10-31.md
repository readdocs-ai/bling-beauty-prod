# Verified API capture recovery

Live owner-authenticated polling and internal recovery now check delayed capture confirmations using authenticated Payment Queries GET requests. A unique result must match the stored reference, configured merchant, GBP amount and payment ID, with lastEvent settlementRequestSubmitted. Authorisation alone cannot release an order.

The private atomic function records a separate API verification, creates one paid order at settlement_submitted, and queues the customer email, admin email and Royal Mail job. No webhook is invented; no payment POST or card retry is made. Row locks, payment ID uniqueness and durable jobs protect replays and late notifications. Existing webhook source protection remains enabled.

Validation: 40 synthetic test files; TypeScript and production build; actual PostgreSQL tests for role denial, amount/claim/environment/merchant/hash rejection, replay, late webhook, shipping evidence and single order/jobs. Remote private function access verified. Real payment/order/email results are checked after deployment.
