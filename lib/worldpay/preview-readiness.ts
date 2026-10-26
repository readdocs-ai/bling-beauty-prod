/** Configuration diagnostic only; never authorises or initiates a payment. */
export type PreviewReadiness = {
  readyForSessionDiagnostic: boolean;
  readyForPaymentTesting: boolean;
  checks: Record<string, boolean>;
  notice: string;
};

export function previewReadiness(env: Record<string, string | undefined>): PreviewReadiness {
  const checks = {
    previewDeployment: env.VERCEL_ENV === 'preview',
    worldpayTryEnvironment: env.WORLDPAY_ENVIRONMENT === 'try',
    previewPreparationEnabled: env.BLING_PREVIEW_CHECKOUT_PREPARATION === 'true',
    checkoutIdPresent: Boolean(env.WORLDPAY_CHECKOUT_ID?.trim()),
    apiUsernamePresent: Boolean(env.WORLDPAY_API_USERNAME?.trim()),
    apiPasswordPresent: Boolean(env.WORLDPAY_API_PASSWORD?.trim()),
    merchantEntityPresent: Boolean(env.WORLDPAY_ENTITY?.trim()),
    statementNarrativePresent: Boolean(env.WORLDPAY_STATEMENT_NARRATIVE?.trim()),
    previewPaymentInitiationEnabled: env.BLING_PREVIEW_PAYMENT_INITIATION === 'true',
    previewOwnershipVerificationEnabled: env.BLING_PREVIEW_PAYMENT_OWNERSHIP_VERIFIED === 'true',
    previewDeviceContinuationEnabled: env.BLING_PREVIEW_3DS_DEVICE_CONTINUATION === 'true',
    previewChallengeContinuationEnabled: env.BLING_PREVIEW_3DS_CHALLENGE_CONTINUATION === 'true',
  };
  const sessionKeys: (keyof typeof checks)[] = [
    'previewDeployment', 'worldpayTryEnvironment', 'previewPreparationEnabled',
    'checkoutIdPresent', 'apiUsernamePresent', 'apiPasswordPresent', 'merchantEntityPresent',
  ];
  const readyForSessionDiagnostic = sessionKeys.every(key => checks[key]);
  return {
    readyForSessionDiagnostic,
    readyForPaymentTesting: readyForSessionDiagnostic && Object.values(checks).every(Boolean),
    checks,
    notice: 'Configuration check only. Does not confirm Worldpay authorisation, 3D Secure completion or settlement. Test cards and Preview only.',
  };
}
