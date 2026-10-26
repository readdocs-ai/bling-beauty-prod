# Worldpay checkout takeover — 26 October 2026

Status: Preview hardening checkpoint. Not production-ready. No successful real-provider payment claimed.

## Baseline confirmed directly

- Repository: readdocs-ai/bling-beauty-prod; branch worldpay-testing.
- Baseline commit: 8eeaf61984cf472caef8e47cea7ed3a7b8d3f8ad.
- Baseline Vercel Preview: dpl_D9SPrzVnRqq2C2oQ2Rqiu4ZhPSvF (READY).
- Preview: https://bling-beauty-prod-21p8llsog-muhammed-vallis-projects.vercel.app
- Deployed readiness endpoint returned HTTP 200 with every reported configuration check true.
- Uploaded ZIP matches all baseline source files except .gitignore, two SVG assets and a review CSV; those unrelated differences have not been copied into the Git checkout.
- No current AGENTS.md found in the repository.
- Earlier error logs are outside the account's one-hour runtime log retention. Recent logs do not reconstruct the failed challenge.

## Changes in this checkpoint

- Resolve issuer callback to the exact checkout origin, restricted to Vercel-owned deployment/branch hostnames supplied in server environment variables. An unknown alias fails before the payment claim. This fixes a potential cross-origin callback failure, not a proved explanation for the original issuer-page crash.
- Retain one tab-scoped attempt and its ownership credential in sessionStorage. Never store PAN/CVC, customer/address details, disposable card sessions or challenge JWTs there. Refuse replacing an unresolved attempt or clearing its submitted marker. Corrupt/unavailable recovery storage prevents payment submission.
- Disable the payment submission after its first request, including uncertain network outcomes. The server's atomic claim remains the duplicate-charge safeguard.
- Match issuer-return messages by origin, iframe source and challenge reference; ignore duplicates. The server callback carries the validated reference. A callback is still not payment proof.
- Catch device/challenge continuation network errors and prevent duplicate continuations in the component.
- Use Next Script onReady so cached SDK scripts can initialise on remount.
- Send no JSON body for the documented challenge-completion POST.
- Preserve BIN when classifying device-data responses.
- Fetch admin data dynamically instead of fetching it during static generation.
- Repair outdated tests for current card-session responses, required browser data, the preparation route and the existing settled-only finalisation rule. No payment safeguards were weakened to make tests pass.

## Validation

- 22 Worldpay Node test files pass. Many inherited tests are source/SQL structure checks, not executed database transactions.
- Production build passes with dummy Supabase settings, without accessing the user's database.
- Four Chromium browser scenarios pass against the locally built application with all external provider/SDK/API interactions simulated: matching challenge return, payment-request network failure, device-continuation network failure and challenge-continuation network failure.
- Browser scenarios cover uppercase JWT/Bin form fields, one challenge submission, duplicate DDC and return messages, incorrect return reference/source rejection, locked resubmission, restored attempt/status after reload and absence of uncaught page exceptions.
- Browser run: install Playwright as a local test dependency, then run `node tests/run-browser-worldpay.mjs` after `npm run build`. Optional BLING_CHROMIUM_EXECUTABLE can select a preinstalled Chromium executable. No Playwright dependency or downloaded browser is added to production dependencies by this checkpoint.

## Not yet verified or implemented

1. Original external issuer-screen crash, including the exact hostname serving Contentful chunk 5306. The SDK exception is a clue, not a demonstrated cause. No new provider transaction was submitted during this checkpoint.
2. Callback delivery through Vercel Deployment Protection and the installed Supabase RPC definitions/permissions. No migrations were applied.
3. A connected authorise/capture workflow. The request currently does not enable automatic settlement, and requestSettlement has no active caller in the checkout routes.
4. Automatic independent verification and finalisation. Existing finalisePayment requires privileged settlement evidence; no automatic caller records that evidence in this checkout. Do not bypass it or infer paid status from challenge completion, authorization or settlement submission.
5. Durable server-side continuation/recovery when the browser disappears. Tab recovery locks resubmission but does not restore expired authentication credentials or automatically complete a charge.
6. Customer-facing production routes and Live environment gates. Active routes remain Preview/Try-only. The old /api/checkout HPP route remains gated by ordering suspension and has not been re-enabled.
7. Actual Supabase finalisation, admin visibility and email delivery. Admin reads orders while finalisation writes bling_paid_orders; reconcile these operational paths before launch.
8. Dependency remediation: npm audit reports 14 vulnerabilities (1 critical, 11 high, 2 moderate). It recommends breaking upgrades for some direct dependencies, including Next.js. No npm audit fix --force was run.
9. Controlled real-provider Try authentication, capture, failure/retry and verification tests; then separately approved Live real-card test and launch.

## Evidence sources

- Integrated 3DS web contract: https://docs.worldpay.com/access/products/payments/enable-features/3ds-authentication/integrated-3ds/web
- Auto settlement: https://docs.worldpay.com/access/products/payments/enable-features/auto-settlement
- Summary queries: https://docs.worldpay.com/access/products/payment-queries/query-by-trans-ref
- Detailed queries: https://docs.worldpay.com/access/products/payment-queries/retrieve-by-payment-id

Worldpay support case from the handover: 29373660. Do not include tokens, JWTs, full action URLs, ownership secrets or card information in support correspondence.

Production checkout remains suspended. No production branch, provider settings or database records were changed by this checkpoint.
