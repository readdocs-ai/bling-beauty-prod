import 'server-only';
import {createHash} from 'node:crypto';
import {supabaseAdmin} from '@/lib/supabase';
import {verifyWorldpayPayment} from '@/lib/worldpay-payment-query';
import {processPaidOrderEmails} from '@/lib/paid-order-finalisation';
import {matchesApiCapture} from './api-capture-policy.mjs';
/** Only a reference from an owner-authenticated status request or internal cron.
 * Uses a provider GET and private atomic commit, never a payment POST. */
export async function recoverApiCapture(reference:string){
 if(process.env.VERCEL_ENV!=='production'||process.env.WORLDPAY_ENVIRONMENT!=='live')return 'unavailable';
 const cutoff=new Date(Date.now()-15000).toISOString();
 const {data:a,error}=await supabaseAdmin.from('bling_checkout_attempts').update({capture_last_checked_at:new Date().toISOString()})
  .eq('reference',reference).eq('payment_environment','live').eq('settlement_mode','auto').eq('status','payment_processing')
  .or(`capture_last_checked_at.is.null,capture_last_checked_at.lt.${cutoff}`)
  .select('reference,status,payment_environment,settlement_mode,currency,amount_pence,payment_claim_id,provider_payment_id').maybeSingle();
 if(error)throw Error('Capture lookup reservation unavailable');
 if(!a||!a.payment_claim_id)return 'not_reserved';
 const query=await verifyWorldpayPayment(a.reference,a.amount_pence);
 if(!matchesApiCapture(a,query))return 'awaiting_verification';
 const entity=process.env.WORLDPAY_ENTITY?.trim();if(!entity)throw Error('Merchant unavailable');
 const hash=createHash('sha256').update(JSON.stringify({reference:a.reference,paymentId:query.paymentId,entity,amountPence:a.amount_pence,currency:'GBP',queryEvent:query.event})).digest('hex');
 const {data:orderId,error:commitError}=await supabaseAdmin.rpc('bling_commit_api_capture',{
  p_reference:a.reference,p_claim:a.payment_claim_id,p_payment_id:query.paymentId,p_amount:a.amount_pence,p_entity:entity,p_query_event:query.event,p_proof_sha256:hash,
 });
 if(commitError||typeof orderId!=='string')throw Error('Capture verification commit unavailable');
 await processPaidOrderEmails(orderId);return 'processed';
}
