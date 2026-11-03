/** Keep the issuer callback on the checkout's exact origin. Never trust arbitrary
 * browser return URLs or forwarded host headers. Only deployment-owned aliases
 * explicitly supplied by Vercel are accepted, before claiming the payment.
 */
export function previewReturnUrl(requestUrl, env) {
  if (env.VERCEL_ENV !== 'preview' || env.WORLDPAY_ENVIRONMENT !== 'try')
    throw new Error('Preview callback unavailable');
  const allowed = [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
    .filter(host => typeof host === 'string' && /^[a-z0-9-]+\.vercel\.app$/.test(host));
  const url = new URL(requestUrl);
  if (url.protocol !== 'https:' || url.port || url.username || url.password ||
      !allowed.includes(url.hostname)) throw new Error('Unrecognised Preview origin');
  return `${url.origin}/api/worldpay/preview-challenge-return`;
}
