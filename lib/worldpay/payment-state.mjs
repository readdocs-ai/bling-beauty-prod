/** Pure fail-closed payment state logic. It never writes a customer order. */
const SETTLED = new Set(['settlementsucceeded', 'settled', 'capturesucceeded', 'salesucceeded']);
const FAILED = new Set(['authorizationfailed', 'settlementfailed', 'refused', 'cancelled', 'canceled']);
export function classifyVerifiedPayment({ payment, expectedReference, expectedAmount, expectedEntity }) {
  if (!payment || typeof payment !== 'object' || !/^BLING-[0-9a-f-]{36}$/.test(expectedReference) ||
      !Number.isInteger(expectedAmount) || expectedAmount <= 0 || !expectedEntity ||
      payment.transactionReference !== expectedReference || payment.entity !== expectedEntity ||
      payment.value?.currency !== 'GBP' || payment.value?.amount !== expectedAmount ||
      typeof payment.paymentId !== 'string' || !payment.paymentId.trim()) {
    return { state: 'uncertain', paymentId: null };
  }
  const lastEvent = typeof payment.lastEvent === 'string' ? payment.lastEvent.toLowerCase() : '';
  const state = SETTLED.has(lastEvent) ? 'paid' : FAILED.has(lastEvent) ? 'failed' : 'pending';
  return { state, paymentId: payment.paymentId };
}
export function classifyMatchingPayments({ payments, expectedReference, expectedAmount, expectedEntity }) {
  if (!Array.isArray(payments)) return { state: 'uncertain', paymentId: null };
  // A conflicting or duplicate provider record requires human reconciliation.
  const matchingReference = payments.filter(p => p && p.transactionReference === expectedReference);
  if (matchingReference.length !== 1) return { state: 'uncertain', paymentId: null };
  return classifyVerifiedPayment({payment: matchingReference[0], expectedReference, expectedAmount, expectedEntity});
}
