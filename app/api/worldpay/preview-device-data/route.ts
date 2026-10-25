/** Preview/Try-only DDC continuation. A customer completion is NOT proof of payment.
 * Disabled by default until a separate test Supabase migration has been verified.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { claim3dsContinuation, record3dsContinuation } from '@/lib/worldpay/continuation-claims';
import { advanceDeviceData } from '@/lib/worldpay/integrated-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const bodySchema = z.object({
  reference: z.string().regex(/^BLING-[0-9a-f-]{36}$/),
  ownershipSecret: z.string().regex(/^[a-f0-9]{64}$/),
  collectionReference: z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/),
}).strict();
function fail(status: number) {
  return NextResponse.json({error:'Payment authentication cannot be continued automatically. Please contact support.'}, {status,headers});
}
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.WORLDPAY_ENVIRONMENT !== 'try' ||
      process.env.BLING_PREVIEW_PAYMENT_INITIATION !== 'true' ||
      process.env.BLING_PREVIEW_PAYMENT_OWNERSHIP_VERIFIED !== 'true' ||
      process.env.BLING_PREVIEW_3DS_DEVICE_CONTINUATION !== 'true') return fail(404);
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > 2048) return fail(413);
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400);
  const { reference, ownershipSecret, collectionReference } = parsed.data;
  // Payment claim IDs and provider action links NEVER come from the browser.
  const { data: attempt, error } = await supabaseAdmin.from('bling_checkout_attempts')
    .select('payment_claim_id,status,provider_outcome')
    .eq('reference',reference).maybeSingle();
  if (error || !attempt || attempt.status !== 'payment_processing' ||
      attempt.provider_outcome !== 'device_data' ||
      typeof attempt.payment_claim_id !== 'string') return fail(409);
  let claimed;
  try {
    claimed = await claim3dsContinuation(reference,attempt.payment_claim_id,ownershipSecret,'device_data');
  } catch { return fail(503); }
  if (!claimed) return fail(409);
  // At this point one database claim is consumed. Never retry automatically after a timeout.
  try {
    const response = await advanceDeviceData(claimed.action,{collectionReference});
    const progress = await record3dsContinuation(reference,attempt.payment_claim_id,claimed.continuationClaim,response);
    if (progress.outcome === 'challenge') {
      const challenge = response.data?.challenge;
      const challengeReference = challenge && typeof challenge === 'object' && !Array.isArray(challenge)
        ? (challenge as Record<string, unknown>).reference : null;
      if (typeof challengeReference !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(challengeReference)) return fail(503);
      const { data: registered, error: registerError } = await supabaseAdmin.rpc('bling_register_issuer_challenge', {
        p_reference:reference, p_payment_claim:attempt.payment_claim_id, p_challenge_reference:challengeReference,
      });
      if (registerError || registered !== true) return fail(503);
    }
    return NextResponse.json({status:'payment_processing',providerStage:progress.outcome,
      message:'Payment requires further verification. Do not resubmit your card.'},{status:202,headers});
  } catch {
    // A failed Worldpay request is ambiguous. Leave the continuation claimed for reconciliation.
    return fail(503);
  }
}
