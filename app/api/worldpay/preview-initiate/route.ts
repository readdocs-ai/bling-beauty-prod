/** Preview/Try-only owned payment initiation. NEVER a production route.
 * A completed response is provider progress, not proof of a paid order.
 * No automatic retries: a network timeout may mean Worldpay processed the payment.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { claimOwnedPreviewAttempt } from '@/lib/worldpay/preview-ownership';
import { createIntegratedPayment } from '@/lib/worldpay/integrated-payments';
import { storeVerifiedProviderProgress } from '@/lib/worldpay/persistent-attempt';
import { buildTryPaymentPayload } from '@/lib/worldpay/preview-payment-payload.mjs';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store' };
const bodySchema = z.object({
  reference: z.string().regex(/^BLING-[0-9a-f-]{36}$/),
  ownershipSecret: z.string().regex(/^[a-f0-9]{64}$/),
  sessionHref: z.string().max(1000).regex(/^https:\/\/try\.access\.worldpay\.com\/sessions\/[A-Za-z0-9%._~+\-]+$/),
}).strict();
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.WORLDPAY_ENVIRONMENT !== 'try' ||
      process.env.BLING_PREVIEW_PAYMENT_INITIATION !== 'true' ||
      process.env.BLING_PREVIEW_PAYMENT_OWNERSHIP_VERIFIED !== 'true') {
    return fail('Preview payment initiation is disabled', 503);
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail('Invalid payment request', 400);
  const { reference, ownershipSecret, sessionHref } = parsed.data;
  const entity = process.env.WORLDPAY_ENTITY;
  const narrative = process.env.WORLDPAY_STATEMENT_NARRATIVE;
  if (!entity || !narrative || !process.env.WORLDPAY_API_USERNAME || !process.env.WORLDPAY_API_PASSWORD) {
    return fail('Worldpay Preview account configuration incomplete', 503);
  }
  let owned;
  try {
    // Validate the merchant configuration and session before taking the irreversible database claim.
    // The final payload is rebuilt from the claimed database row below.
    buildTryPaymentPayload({reference,status:'payment_processing',currency:'GBP',amount_pence:1},sessionHref,entity,narrative);
    owned = await claimOwnedPreviewAttempt(reference, ownershipSecret);
  } catch (e) {
    console.error('Worldpay attempt claim unavailable', e instanceof Error ? e.name : 'unknown');
    return fail('Payment attempt could not be securely claimed', 503);
  }
  if (!owned) return fail('Payment attempt already claimed or ownership invalid', 409);

  // The claim is irreversible without manual provider reconciliation; never retry on error.
  try {
    const payload = buildTryPaymentPayload(owned.attempt,sessionHref,entity,narrative);
    const response = await createIntegratedPayment(payload);
    const recorded = await storeVerifiedProviderProgress(reference,owned.claim,response);
    return NextResponse.json({
      reference,
      status: 'payment_processing',
      providerStage: recorded.outcome,
      // Action URLs stay in the service-role database, not in this response.
      message: recorded.outcome === 'declined' ? 'Payment was declined.' :
        recorded.outcome === 'uncertain' ? 'Payment status needs manual verification. Do not retry.' :
        'Payment initiated. Further authentication or settlement is required; do not retry.',
    }, {status:202,headers:noStore});
  } catch (e) {
    // Network errors and failures to persist are ambiguous. Keep claim locked.
    console.error('Worldpay initiation unresolved',e instanceof Error ? e.name : 'unknown');
    // On network failure there may be no provider response to store. The claimed
    // payment_processing attempt is intentionally left locked for reconciliation.
    return fail('Payment status is unresolved. Do not retry or submit another payment.', 503);
  }
}
