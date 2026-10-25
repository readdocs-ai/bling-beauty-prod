/** Pure Payments API (2024-06-01) request builder. Never accepts browser amount/entity. */
const REF = /^BLING-[0-9a-f-]{36}$/;
const SESSION = /^https:\/\/try\.access\.worldpay\.com\/sessions\/[A-Za-z0-9%._~+\-]+$/;
export function buildTryPaymentPayload(order, sessionHref, entity, narrative) {
  if (!order || !REF.test(order.reference) || order.status !== 'payment_processing' ||
      order.currency !== 'GBP' || !Number.isSafeInteger(order.amount_pence) ||
      order.amount_pence < 1 || order.amount_pence > 1000000) throw Error('Unclaimed or invalid order');
  if (typeof sessionHref !== 'string' || !SESSION.test(sessionHref) || sessionHref.length > 1000)
    throw Error('Invalid Worldpay Try checkout session');
  if (typeof entity !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9 ]{0,31}$/.test(entity)) throw Error('Invalid merchant entity');
  if (typeof narrative !== 'string' || !/^[A-Za-z0-9 .-]{3,24}$/.test(narrative)) throw Error('Invalid statement narrative');
  return {
    transactionReference: order.reference,
    merchant: { entity }, channel: 'ecom',
    instruction: {
      method: 'card', paymentInstrument: { type: 'checkout', sessionHref },
      narrative: { line1: narrative },
      value: { currency: 'GBP', amount: order.amount_pence },
    },
  };
}
