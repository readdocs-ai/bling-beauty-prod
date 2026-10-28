import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderEmail } from '@/lib/email/send';
import type { EmailOrder } from '@/lib/email/templates';
import { verifyWorldpayPayment } from '@/lib/worldpay-payment-query';
import {emailDeliverySettings,emailIdempotencyKey} from '@/lib/email/delivery-policy.mjs';
import {buildEmail} from '@/lib/email/templates';

type Order = {
 id:string; reference:string; amount_pence:number;payment_environment:'try'|'live';
 customer:{name:string;email:string;phone?:string};
 shipping:{address1:string;address2?:string;city:string;postcode:string;country:'GB'};
 items:{name:string;quantity:number;unitPence:number}[];
};

/** Only independently verified settlement already recorded by the privileged database
 * may be finalised. Payment Queries results are progress, not settlement proof.
 * An external reconciliation operator must first verify evidence and execute
 * bling_record_verified_settlement with the stored payment claim.
 */
export async function finalisePayment(reference:string) {
 if(!/^BLING-[0-9a-f-]{36}$/.test(reference)) throw new Error('Invalid reference');
 const {data:attempt,error}=await supabaseAdmin.from('bling_checkout_attempts')
  .select('reference,amount_pence,status,provider_payment_id,provider_last_event,payment_verified_at')
  .eq('reference',reference).single();
 if(error || !attempt) throw new Error('Checkout unavailable');
 if(attempt.status !== 'settlement_verified' && attempt.status !== 'paid_verified') {
   // Lookup can aid operator investigation, but MUST NOT create paid orders.
   const check=await verifyWorldpayPayment(reference,attempt.amount_pence);
   return {state: check.state === 'failed' ? 'failed' as const : 'pending' as const};
 }
 if(attempt.provider_last_event !== 'settled' || !attempt.payment_verified_at ||
    typeof attempt.provider_payment_id !== 'string' || attempt.provider_payment_id.length < 3)
   throw new Error('Missing verified settlement evidence');
 const {data:id,error:rpcError}=await supabaseAdmin.rpc('bling_finalise_verified_payment',
   {p_reference:reference,p_payment_id:attempt.provider_payment_id});
 if(rpcError || typeof id !== 'string') throw new Error('Unable to persist verified payment');
 return {state:'paid' as const,orderId:id};
}

// Jobs are durable and individually reserved. A failed/unknown provider response is
// deliberately not automatically retried: this avoids duplicate customer messages.
export async function processPaidOrderEmails(orderId:string) {
 const {data,error} = await supabaseAdmin.from('bling_paid_orders').select('*').eq('id',orderId).eq('status','paid').single();
 if(error || !data) throw new Error('Verified order not found');
 if(!data.provider_event_id||!data.verified_at||!data.provider_payment_id)throw Error('Verified settlement event is required for order emails');
 const order = data as Order;
 const email:EmailOrder={reference:order.reference,customerName:order.customer.name,customerEmail:order.customer.email,totalGBP:order.amount_pence/100,items:order.items.map(i=>({name:i.name,quantity:i.quantity})),shipping:order.shipping};
 const outcomes:string[]=[];
 for(const [kind,emailKind] of [['customer_email','payment-confirmed'],['admin_email','admin-alert']] as const){
  // Disabled/configuration failures leave durable jobs pending, without claiming them.
  try{
   if(!process.env.RESEND_API_KEY)throw Error('Email unavailable');
   emailDeliverySettings(process.env,order.payment_environment,[buildEmail(emailKind,email).recipient]);
  }catch{outcomes.push(`${kind}:disabled_or_unconfigured`);continue;}
  const {data:claimed,error:claimError}=await supabaseAdmin.from('bling_paid_order_jobs')
   .update({status:'sending',claimed_at:new Date().toISOString()}).eq('order_id',orderId).eq('kind',kind).eq('status','pending').select('kind').maybeSingle();
  if(claimError){outcomes.push(`${kind}:database_error`);continue;}
  if(!claimed){outcomes.push(`${kind}:already_claimed`);continue;}
  try{
   const result=await sendOrderEmail(emailKind,email,{environment:order.payment_environment,idempotencyKey:emailIdempotencyKey(order.payment_environment,order.id,kind)});
   const {error:updateError}=await supabaseAdmin.from('bling_paid_order_jobs').update({status:'accepted',completed_at:new Date().toISOString(),provider_id:result.id}).eq('order_id',orderId).eq('kind',kind).eq('status','sending');
   if(updateError) throw updateError;
   outcomes.push(`${kind}:accepted`);
  }catch(err){
   await supabaseAdmin.from('bling_paid_order_jobs').update({status:'needs_review',last_error:'Delivery is unresolved. Review the provider before any retry.'}).eq('order_id',orderId).eq('kind',kind).eq('status','sending');
   outcomes.push(`${kind}:needs_review`);
  }
 }
 return outcomes;
}
