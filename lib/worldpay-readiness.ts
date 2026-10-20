/** Server-only configuration check. Never return credential values to clients. */
export function worldpayReadiness() {
  const environment = process.env.WORLDPAY_ENVIRONMENT === 'live' ? 'live' : 'try';
  const required = ['WORLDPAY_API_USERNAME', 'WORLDPAY_API_PASSWORD', 'WORLDPAY_ENTITY', 'NEXT_PUBLIC_SITE_URL'];
  const missing = required.filter((name) => !process.env[name]?.trim());
  return {
    environment,
    credentialsConfigured: missing.length === 0,
    missingEnvironmentVariables: missing,
    liveCheckoutEnabled: false,
    reason: 'Hosted payment initiation is implemented but untested against Worldpay. Verified payment callbacks, paid order finalisation, emails and Royal Mail import remain disabled.',
  } as const;
}
