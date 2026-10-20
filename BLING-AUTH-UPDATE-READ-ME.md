# BLING Preview administrator session security update

## Changes
- Replaces the reusable SHA-256(username:password) cookie with a signed, randomised, seven-day session token.
- Validates session age and signature in Edge middleware, including administrator API routes.
- Returns HTTP 401 for unauthenticated `/admin/api/*` requests instead of redirecting to an HTML login page.
- Preserves existing login UI, cookie name and administrator credentials; existing admin sessions must sign in again.
- No Worldpay payment authorisation, live checkout or ordering suspension changes.

## Deployment
This is a source-only package. Copy the project files into your `BLING-GITHUB-TESTING` clone (do not replace `.git`, `.env.local`, or `.vercel`), then run `npm ci` and `npm run build` before committing to `worldpay-testing`. Preview admin login must be retested. Do not merge into `main` without approval.

## Remaining security work
- Server-side rate limiting for admin login (requires shared durable storage; not implemented).
- Independent administrator session secret / managed session revocation (not implemented).
- Review CSRF protections and admin API authorization before adding payment authorisation.
- Confirm Worldpay Access Payments API contract, 3DS flow and credentials in Try before adding a new authorisation route.
