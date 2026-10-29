/** Owned Live Access payment initiation.
 * A completed response is provider progress, not proof of a paid order.
 * No automatic retries: a network timeout may mean Worldpay processed the payment.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {claimOwnedLiveAttempt,livePreparationAllowed} from '@/lib/worldpay/live-checkout';
import { createIntegratedPayment } from '@/lib/worldpay/integrated-payments';
import { storeVerifiedProviderProgress } from '@/lib/worldpay/persistent-attempt';
import { buildIntegratedPaymentPayload } from '@/lib/worldpay/preview-payment-payload.mjs';
import {liveReturnUrl} from '@/lib/worldpay/live-policy.mjs';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store' };
const bodySchema = z.object({
  reference: z.string().regex(/^BLING-[0-9a-f-]{36}$/),
  ownershipSecret: z.string().regex(/^[a-f0-9]{64}$/),
  browser: z.object({userAgent:z.string().min(3).max(512), language:z.string().min(2).max(35),width:z.number().int().min(1).max(20000),height:z.number().int().min(1).max(20000),timeZone:z.number().int().min(-840).max(840)}).strict(),
  sessionHref: z.string().max(1000).regex(/^https:\/\/access\.worldpay\.com\/sessions\/[A-Za-z0-9%._~+\-]+$/),
}).strict();
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

export async function POST(request: Request) {
  if(!await livePreparationAllowed(request))return fail('Card payments are temporarily unavailable.',503);
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail('Invalid payment request', 400);
  const { reference, ownershipSecret, sessionHref, browser } = parsed.data;
  // The iframe must return to the same origin as its parent. Vercel's immutable
  // deployment hostname may differ from the branch alias the customer opened.
  let returnUrl: string;
  try { returnUrl = liveReturnUrl(request.url, process.env); }
  catch { return fail('Payment return URL unavailable',503); }
  const threeDS = {...browser,returnUrl};
  const entity = process.env.WORLDPAY_ENTITY;
  const narrative = process.env.WORLDPAY_STATEMENT_NARRATIVE;
  if (!entity || !narrative || !process.env.WORLDPAY_API_USERNAME || !process.env.WORLDPAY_API_PASSWORD) {
    return fail('Worldpay account configuration incomplete', 503);
  }
  let owned;
  try {
    // Validate the merchant configuration and session before taking the irreversible database claim.
    // The final payload is rebuilt from the claimed database row below.
    buildIntegratedPaymentPayload({reference,status:'payment_processing',currency:'GBP',amount_pence:1,settlement_mode:'auto'},sessionHref,entity,narrative,threeDS,'live');
    owned = await claimOwnedLiveAttempt(reference, ownershipSecret);
  } catch (e) {
    console.error('Worldpay attempt claim unavailable', e instanceof Error ? e.name : 'unknown');
    return fail('Payment attempt could not be securely claimed', 503);
  }
  if (!owned) return fail('Payment attempt already claimed or ownership invalid', 409);

  // The claim is irreversible without manual provider reconciliation; never retry on error.
  try {
    const payload = buildIntegratedPaymentPayload(owned.attempt,sessionHref,entity,narrative,threeDS,'live');
    const response = await createIntegratedPayment(payload,'live');
    const recorded = await storeVerifiedProviderProgress(reference,owned.claim,response,'live');
    return NextResponse.json({
      reference,
      status: 'payment_processing',
      providerStage: recorded.outcome,
      // Only browser-facing DDC parameters are returned, never server action URLs.
      ...(recorded.outcome === 'device_data' && response.data.deviceDataCollection && typeof response.data.deviceDataCollection === 'object'
        ? {deviceData: response.data.deviceDataCollection} : {}),
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
