/** Server-only persistence gateway for one Worldpay transaction attempt.
 * This module stores validated provider progress but NEVER initiates a charge.
 */
import 'server-only';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { checkedProviderResult } from './integrated-payments-contract.mjs';

const REFERENCE = /^BLING-[0-9a-f-]{36}$/;
type ProviderReply = { httpStatus: number; outcome: string; actions: Record<string,string>; data: Record<string,unknown>; correlationId: string | null };

export async function claimPendingPayment(reference: string) {
  if (!REFERENCE.test(reference)) throw new Error('Invalid checkout reference');
  // Claim once. Never retry automatically after an ambiguous provider response.
  const claim = randomUUID();
  const { data, error } = await supabaseAdmin.rpc('bling_claim_payment', {
    p_reference: reference, p_claim: claim,
  });
  if (error) throw new Error('Payment claim unavailable: verify the preview SQL migration');
  if (data !== true) return null;
  const { data: attempt, error: readError } = await supabaseAdmin
    .from('bling_checkout_attempts')
    .select('reference,status,amount_pence,currency,items,customer,shipping,payment_claim_id')
    .eq('reference',reference).eq('payment_claim_id',claim).single();
  if (readError || !attempt || attempt.status !== 'payment_processing' ||
      attempt.currency !== 'GBP' || !Number.isSafeInteger(attempt.amount_pence) || attempt.amount_pence < 1)
    throw new Error('Claimed payment requires manual reconciliation');
  return { claim, attempt };
}

export async function storeVerifiedProviderProgress(reference: string, claim: string, response: ProviderReply) {
  if (!REFERENCE.test(reference) || !/^[0-9a-f-]{36}$/.test(claim)) throw new Error('Invalid claim');
  const checked = checkedProviderResult(response.httpStatus,response.data);
  // Never trust an arbitrary caller-supplied outcome/actions object.
  const outcome = checked.outcome;
  const actions = checked.actions;
  const { data, error } = await supabaseAdmin.rpc('bling_store_provider_progress', {
    p_reference:reference, p_claim:claim, p_outcome:outcome,
    p_actions:actions, p_correlation:response.correlationId,
  });
  if (error || data !== true) throw new Error('Worldpay response could not be durably recorded; do not retry payment');
  return { outcome, actions };
}

export async function getCheckoutAttemptStatus(reference: string, ownershipSecret: string) {
  if (!REFERENCE.test(reference) || !/^[a-f0-9]{64}$/.test(ownershipSecret)) return null;
  const { data, error } = await supabaseAdmin.from('bling_checkout_attempts')
    .select('status,provider_outcome,browser_secret_sha256,settlement_mode').eq('reference',reference).maybeSingle();
  if (error || !data || typeof data.browser_secret_sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(data.browser_secret_sha256)) return null;
  const expected = Buffer.from(data.browser_secret_sha256, 'hex');
  const actual = createHash('sha256').update(ownershipSecret).digest();
  if (!timingSafeEqual(expected, actual)) return null;
  // No PII, provider action URLs, claim IDs, or payment IDs leave this function.
  return {
    settlementMode:data.settlement_mode==='auto'?'auto':'manual',
    status: ['pending','payment_processing','settlement_verified','paid_verified'].includes(data.status)
      ? data.status : 'unresolved',
    providerStage: ['device_data','challenge','authorised','settlement_requested','declined','uncertain']
      .includes(data.provider_outcome) ? data.provider_outcome : null,
  };
}
