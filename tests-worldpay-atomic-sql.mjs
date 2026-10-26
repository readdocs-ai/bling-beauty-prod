import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('./supabase/worldpay-payment-lock-and-finalisation-v2.sql', import.meta.url),'utf8');
for(const required of [
 'bling_claim_payment','status=\'pending\' AND payment_claim_id IS NULL',
 "status='payment_processing'",'payment_claim_id=p_claim',
 "p_event <> 'settled'",
 "status='settlement_verified'",'payment_verified_at IS NULL',
 'a.provider_payment_id IS DISTINCT FROM p_payment_id',
 'FOR UPDATE','ON CONFLICT (reference) DO NOTHING',
 'ON CONFLICT DO NOTHING','REVOKE ALL ON FUNCTION public.bling_claim_payment',
 'REVOKE ALL ON FUNCTION public.bling_finalise_verified_payment'
 ]) assert.ok(s.includes(required),`Missing invariant: ${required}`);
assert.ok(!s.includes('status IN (\'pending\',\'redirected\',\'paid_verified\')'));
console.log('14 payment lock/finaliser structural assertions passed; database transaction tests NOT run.');
