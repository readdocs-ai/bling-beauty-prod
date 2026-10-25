/** Pure configuration checks. Do not expose credentials or session data. */
export type PreviewReadiness = { readyForSessionDiagnostic: boolean; readyForPaymentTesting: false; checks: Record<string, boolean> };
export function previewReadiness(env: Record<string, string | undefined>): PreviewReadiness {
  const checks = {
    previewDeployment: env.VERCEL_ENV === 'preview',
    worldpayTryEnvironment: env.WORLDPAY_ENVIRONMENT === 'try',
    previewPreparationEnabled: env.BLING_PREVIEW_CHECKOUT_PREPARATION === 'true',
    checkoutIdPresent: Boolean(env.WORLDPAY_CHECKOUT_ID?.trim()),
    apiUsernamePresent: Boolean(env.WORLDPAY_API_USERNAME?.trim()),
    apiPasswordPresent: Boolean(env.WORLDPAY_API_PASSWORD?.trim()),
    merchantEntityPresent: Boolean(env.WORLDPAY_ENTITY?.trim()),
  };
  return {
    readyForSessionDiagnostic: Object.values(checks).every(Boolean),
    readyForPaymentTesting: false,
    checks,
  };
}
