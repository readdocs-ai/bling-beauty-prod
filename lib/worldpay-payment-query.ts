import 'server-only';

type Payment = { paymentId?: string; transactionReference?: string; entity?: string; lastEvent?: string; value?: { currency?: string; amount?: number } };

/** Authoritative server-to-server payment check; never trust the redirect URL. */
export async function verifyWorldpayPayment(reference: string, amountPence: number): Promise<{ state: 'paid' | 'pending' | 'failed'; paymentId?: string }> {
  if (!/^BLING-[0-9a-f-]{36}$/.test(reference)) throw new Error('Invalid transaction reference');
  const username = process.env.WORLDPAY_API_USERNAME?.trim();
  const password = process.env.WORLDPAY_API_PASSWORD?.trim();
  const entity = process.env.WORLDPAY_ENTITY?.trim();
  if (!username || !password || !entity) throw new Error('Worldpay credentials missing');
  const base = process.env.WORLDPAY_ENVIRONMENT === 'live' ? 'https://access.worldpay.com' : 'https://try.access.worldpay.com';
  const response = await fetch(`${base}/paymentQueries/payments?transactionReference=${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`, Accept: 'application/vnd.worldpay.payment-queries-v1.hal+json' },
    cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Worldpay query failed (${response.status})`);
  const body = await response.json() as { _embedded?: { payments?: Payment[] } };
  const payments = body._embedded?.payments ?? [];
  const matching = payments.filter(p => p.transactionReference === reference && p.entity === entity && p.value?.currency === 'GBP' && p.value?.amount === amountPence);
  if (matching.length !== 1 || !matching[0].paymentId) return { state: 'pending' };
  const payment = matching[0];
  const event = (payment.lastEvent ?? '').toLowerCase();
  // Only definitive captured/settled states fulfil goods; an authorization alone is insufficient.
  if (['settlementsucceeded', 'settled', 'capturesucceeded', 'salesucceeded'].includes(event)) return { state: 'paid', paymentId: payment.paymentId };
  if (['authorizationfailed', 'settlementfailed', 'refused', 'cancelled', 'canceled'].includes(event)) return { state: 'failed', paymentId: payment.paymentId };
  return { state: 'pending', paymentId: payment.paymentId };
}
