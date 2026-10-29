import 'server-only';
import {randomUUID} from 'node:crypto';
import {supabaseAdmin} from '@/lib/supabase';
import {prepareRoyalMailDraft,royalMailReference,type Packing,type RoyalMailResult} from './click-drop-policy.mjs';
import {importClickDropOrder,findClickDropOrder,clickDropConfigured,prepareClickDropAccount} from '@/lib/royal-mail-click-drop';
async function loadOrder(id:string){
 const {data,error}=await supabaseAdmin.from('bling_paid_orders').select('*').eq('id',id).eq('status','paid').eq('payment_environment','live').single();
 if(error||!data||!data.verified_at||!data.provider_event_id||!data.provider_payment_id)throw Error('Verified Live paid order not found');return data;
}
async function finish(id:string,claim:string,result:RoyalMailResult){
 const {data,error}=await supabaseAdmin.rpc('bling_finish_royal_mail_import',{p_order_id:id,p_claim:claim,p_reference:result.reference,p_provider_id:result.orderIdentifier,p_tracking:result.trackingNumber,p_shipped_at:result.shippedOn});
 if(error||data!==true)throw Error('Royal Mail responded but saving failed. Check the existing import; do not create another.');
 return result;
}
export async function importPaidOrderToRoyalMail(id:string,packing:Packing){
 if(process.env.VERCEL_ENV!=='production'||process.env.WORLDPAY_ENVIRONMENT!=='live'||process.env.BLING_ROYAL_MAIL_IMPORT_ENABLED!=='true')throw Error('Royal Mail imports are disabled');
 if(!clickDropConfigured())throw Error('Royal Mail API key is not configured');
 const order=await loadOrder(id);
 let payload;try{payload=prepareRoyalMailDraft(order,packing);}catch(e){throw Object.assign(e instanceof Error?e:new Error('Check packing details'),{retrySafe:true});}
 payload=await prepareClickDropAccount(payload);
 const claim=randomUUID();
 const {data,error}=await supabaseAdmin.rpc('bling_claim_royal_mail_import',{p_order_id:id,p_claim:claim,p_weight:packing.weightGrams,p_tax:packing.taxPence,p_format:packing.packageFormat,p_reference:payload.items[0].orderReference});
 if(error)throw Error('Shipping database claim is unavailable');if(data!==true)throw Error('This import is already claimed. Check the existing import before continuing.');
 try{return await finish(id,claim,await importClickDropOrder(payload));}
 catch{
  await supabaseAdmin.from('bling_paid_order_jobs').update({status:'needs_review',last_error:'Import unresolved. Use Check existing import; never repeat a POST after timeout.'}).eq('order_id',id).eq('kind','royal_mail').eq('status','sending');
  throw Error('Import not confirmed. Use Check existing import; do not submit another import.');
 }
}
/** Read provider state only. A timeout never causes another create-order request. */
export async function reconcileRoyalMailImport(id:string){
 if(process.env.VERCEL_ENV!=='production'||process.env.WORLDPAY_ENVIRONMENT!=='live')throw Error('Live shipping runtime required');
 const order=await loadOrder(id);
 if(!order.royal_mail_claim_id||order.royal_mail_reference!==royalMailReference(order.reference))throw Error('There is no claimed import to check');
 const existing=await findClickDropOrder(order.royal_mail_reference);
 if(!existing)return {found:false,message:'No matching Royal Mail order was found. Check Click & Drop manually; no new import was sent.'};
 if(order.royal_mail_order_id&&order.royal_mail_order_id!==existing.orderIdentifier)throw Error('Royal Mail identifier mismatch');
 await finish(id,order.royal_mail_claim_id,existing);return {found:true,...existing};
}
