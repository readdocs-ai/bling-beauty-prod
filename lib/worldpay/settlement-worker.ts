import 'server-only';
import {supabaseAdmin} from '@/lib/supabase';
import {verifyWorldpayPayment} from '@/lib/worldpay-payment-query';
import {matchesSettledQuery,type SettledEvent} from './settlement-events.mjs';
import {processPaidOrderEmails} from '@/lib/paid-order-finalisation';
/** Durable inbox survives a terminated function. Re-running only queries/finalises; never charges. */
export async function processSettlementEvent(event:SettledEvent){
 if(process.env.WORLDPAY_ENVIRONMENT!==event.environment)return 'environment_mismatch';
 // Rotate deferred/unmatched receipts so the first few cannot block later orders.
 const checked=await supabaseAdmin.from('bling_worldpay_settlement_events')
  .update({last_checked_at:new Date().toISOString()}).eq('environment',event.environment)
  .eq('event_id',event.event_id).eq('body_sha256',event.body_sha256).eq('status','pending');
 if(checked.error)throw Error('Settlement receipt unavailable');
 const {data:a,error}=await supabaseAdmin.from('bling_checkout_attempts').select(
  'reference,payment_environment,currency,amount_pence,payment_claim_id,provider_payment_id,status,settlement_mode'
 ).eq('reference',event.reference).maybeSingle();
 if(error||!a)return 'unmatched';
 const query=await verifyWorldpayPayment(event.reference,a.amount_pence);
 if(!matchesSettledQuery(event,a,query))return 'awaiting_verification';
 const {data:orderId,error:commitError}=await supabaseAdmin.rpc('bling_commit_settled_event',{
  p_environment:event.environment,p_event_id:event.event_id,p_body_sha256:event.body_sha256,
  p_claim:a.payment_claim_id,p_payment_id:query.paymentId,
 });
 if(commitError||typeof orderId!=='string')throw Error('Settlement commit unavailable');
 await processPaidOrderEmails(orderId);
 return 'processed';
}
export async function recoverSettlementInbox(){
 const environment=process.env.WORLDPAY_ENVIRONMENT;
 if(environment!=='try'&&environment!=='live')throw Error('Invalid environment');
 const {data,error}=await supabaseAdmin.from('bling_worldpay_settlement_events').select('*')
  .eq('environment',environment).eq('status','pending')
  .order('last_checked_at',{ascending:true,nullsFirst:true}).order('received_at').limit(5);
 if(error)throw Error('Settlement inbox unavailable');
 const outcomes=[];
 for(const row of data??[]){try{outcomes.push(await processSettlementEvent(row as SettledEvent));}catch{outcomes.push('needs_review');}}
 // Acknowledged events may have left email jobs pending while delivery was disabled.
 const jobs=await supabaseAdmin.from('bling_paid_order_jobs').select('order_id,bling_paid_orders!inner(payment_environment)')
  .eq('status','pending').in('kind',['customer_email','admin_email']).eq('bling_paid_orders.payment_environment',environment).limit(10);
 if(jobs.error)throw Error('Email queue unavailable');
 for(const id of new Set((jobs.data??[]).map(j=>j.order_id))){
  try{outcomes.push(...await processPaidOrderEmails(id));}catch{outcomes.push('email_needs_review');}
 }
 return outcomes;
}
