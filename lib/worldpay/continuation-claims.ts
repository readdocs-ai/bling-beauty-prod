import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { checkedProviderResult, safeIntegratedAction } from './integrated-payments-contract.mjs';

const REF = /^BLING-[0-9a-f-]{36}$/;
const UUID = /^[0-9a-f-]{36}$/;
const SECRET = /^[a-f0-9]{64}$/;
type Stage = 'device_data' | 'challenge';
type ProviderReply = { httpStatus:number; data:Record<string,unknown>; correlationId:string|null };

/** Claim one 3DS action atomically. No automatic retries; claim BEFORE any Worldpay POST. */
export async function claim3dsContinuation(reference:string, paymentClaim:string, ownershipSecret:string, stage:Stage) {
  if (!REF.test(reference) || !UUID.test(paymentClaim) || !SECRET.test(ownershipSecret) ||
      !['device_data','challenge'].includes(stage)) return null;
  const continuationClaim = randomUUID();
  const digest = createHash('sha256').update(ownershipSecret).digest('hex');
  const { data, error } = await supabaseAdmin.rpc('bling_claim_provider_continuation', {
    p_reference:reference, p_payment_claim:paymentClaim, p_secret_sha256:digest,
    p_expected_stage:stage, p_continuation_claim:continuationClaim,
  });
  if (error) throw new Error('3DS claim migration unavailable');
  if (!data || typeof data.action !== 'string') return null;
  const action = safeIntegratedAction(data.action, stage === 'device_data' ? 'device':'challenge');
  return { continuationClaim, action };
}

/** Store only a response to the matching claimed step. Never mark an order paid here. */
export async function record3dsContinuation(reference:string,paymentClaim:string,continuationClaim:string,response:ProviderReply) {
  const checked = checkedProviderResult(response.httpStatus,response.data);
  const { data, error } = await supabaseAdmin.rpc('bling_store_continuation_progress', {
    p_reference:reference, p_payment_claim:paymentClaim, p_continuation_claim:continuationClaim,
    p_outcome:checked.outcome, p_actions:checked.actions, p_correlation:response.correlationId,
  });
  if (error || data !== true) throw new Error('3DS continuation unresolved: manual reconciliation required');
  return { outcome:checked.outcome };
}
