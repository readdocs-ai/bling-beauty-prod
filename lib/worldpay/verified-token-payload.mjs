/** Safe payload builder for Worldpay Verified Tokens one-time verification.
 * This module accepts only an opaque Worldpay Checkout card-session href.
 * No PAN/CVC fields or arbitrary merchant identity are accepted.
 */
export function oneTimeVerifiedTokenPayload({ cardSessionHref, holderName, merchantEntity }) {
  const url = new URL(cardSessionHref);
  if (url.origin !== 'https://try.access.worldpay.com' ||
      url.username || url.password || url.search || url.hash ||
      !/^\/verifiedTokens\/sessions\/[A-Za-z0-9_+%=-]{12,1024}$/.test(url.pathname)) {
    throw new Error('Invalid Worldpay Try card session');
  }
  if (typeof holderName !== 'string' || holderName.trim().length < 2 || holderName.length > 120 ||
      typeof merchantEntity !== 'string' || !/^[A-Za-z0-9_.-]{1,100}$/.test(merchantEntity)) {
    throw new Error('Invalid verified-token context');
  }
  return {
    paymentInstrument: { type: 'card/checkout', cardHolderName: holderName.trim(), sessionHref: url.href },
    merchant: { entity: merchantEntity },
    verificationCurrency: 'GBP'
  };
}
