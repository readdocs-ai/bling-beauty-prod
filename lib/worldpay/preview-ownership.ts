import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase';

/** Compare-and-swap claim: possession of reference alone cannot initiate a payment. */
export async function claimOwnedPreviewAttempt(reference: string, ownershipSecret: string) {
  if (!/^BLING-[0-9a-f-]{36}$/.test(reference) || !/^[a-f0-9]{64}$/.test(ownershipSecret)) return null;
  const claim = randomUUID();
  const digest = createHash('sha256').update(ownershipSecret).digest('hex');
  const { data, error } = await supabaseAdmin.rpc('bling_claim_owned_payment', {
    p_reference: reference, p_claim: claim, p_secret_sha256: digest,
  });
  if (error) throw new Error('Owned-payment claim migration missing or unavailable');
  if (data !== true) return null;
  const result = await supabaseAdmin.from('bling_checkout_attempts')
    .select('reference,status,amount_pence,currency,payment_claim_id')
    .eq('reference', reference).eq('payment_claim_id', claim).single();
  if (result.error || !result.data || result.data.status !== 'payment_processing')
    throw new Error('Claimed payment must be reconciled manually');
  return { claim, attempt: result.data };
}
