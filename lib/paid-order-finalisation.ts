import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderEmail } from '@/lib/email/send';
import type { EmailOrder } from '@/lib/email/templates';
import { verifyWorldpayPayment } from '@/lib/worldpay-payment-query';

type Order = {
 id:string; reference:string; amount_pence:number;
 customer:{name:string;email:string;phone?:string};
 shipping:{address1:string;address2?:string;city:string;postcode:string;country:'GB'};
 items:{name:string;quantity:number;unitPence:number}[];
};

export async function finalisePayment(reference:string) {
 const {data:attempt,error} = await supabaseAdmin.from('bling_checkout_attempts').select('reference,amount_pence,status').eq('reference',reference).single();
 if(error || !attempt || !['pending','redirected','paid_verified'].includes(attempt.status)) throw new Error('Checkout not found');
 const verification = await verifyWorldpayPayment(reference,attempt.amount_pence);
 if(verification.state !== 'paid' || !verification.paymentId) return {state:verification.state};
 const {data:id,error:rpcError} = await supabaseAdmin.rpc('bling_finalise_verified_payment',{p_reference:reference,p_payment_id:verification.paymentId});
 if(rpcError || typeof id !== 'string') throw new Error('Unable to persist verified payment');
 return {state:'paid' as const,orderId:id};
}

// Jobs are durable and individually reserved. A failed/unknown provider response is
// deliberately not automatically retried: this avoids duplicate customer messages.
export async function processPaidOrderEmails(orderId:string) {
 const {data,error} = await supabaseAdmin.from('bling_paid_orders').select('*').eq('id',orderId).eq('status','paid').single();
 if(error || !data) throw new Error('Verified order not found');
 const order = data as Order;
 const email:EmailOrder={reference:order.reference,customerName:order.customer.name,customerEmail:order.customer.email,totalGBP:order.amount_pence/100,items:order.items.map(i=>({name:i.name,quantity:i.quantity}))};
 const outcomes:string[]=[];
 for(const [kind,emailKind] of [['customer_email','payment-confirmed'],['admin_email','admin-alert']] as const){
  const {data:claimed,error:claimError}=await supabaseAdmin.from('bling_paid_order_jobs')
   .update({status:'sending',claimed_at:new Date().toISOString()}).eq('order_id',orderId).eq('kind',kind).eq('status','pending').select('kind').maybeSingle();
  if(claimError){outcomes.push(`${kind}:database_error`);continue;}
  if(!claimed){outcomes.push(`${kind}:already_claimed`);continue;}
  try{
   const result=await sendOrderEmail(emailKind,email);
   const {error:updateError}=await supabaseAdmin.from('bling_paid_order_jobs').update({status:'sent',completed_at:new Date().toISOString(),provider_id:result.id}).eq('order_id',orderId).eq('kind',kind);
   if(updateError) throw updateError;
   outcomes.push(`${kind}:sent`);
  }catch(err){
   await supabaseAdmin.from('bling_paid_order_jobs').update({status:'needs_review',last_error:err instanceof Error?err.message.slice(0,250):'Unknown error'}).eq('order_id',orderId).eq('kind',kind);
   outcomes.push(`${kind}:needs_review`);
  }
 }
 return outcomes;
}
