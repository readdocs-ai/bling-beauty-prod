import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {supabaseAdmin} from '@/lib/supabase';
import {getOrderingState} from '@/lib/order-switch';
import {assertLiveRuntime,liveReadiness,LIVE_ORIGINS} from './live-policy.mjs';
/** In-flight authentication remains available if new orders are subsequently paused. */
export function liveRequestAllowed(request:Request) {
 try {assertLiveRuntime(process.env);const u=new URL(request.url);
  return LIVE_ORIGINS.includes(u.origin)&&request.headers.get('origin')===u.origin&&
   Number(request.headers.get('content-length')??0)<=8192;
 }catch{return false;}
}
export async function livePreparationAllowed(request:Request) {
 if(!liveRequestAllowed(request)||!liveReadiness(process.env).ready)return false;
 const state=await getOrderingState();return state.configured&&!state.suspended;
}
export async function liveAttempt(reference:string) {
 const {data,error}=await supabaseAdmin.from('bling_checkout_attempts').select('*')
  .eq('reference',reference).eq('payment_environment','live').maybeSingle();
 if(error)throw Error('Attempt unavailable');return data;
}
export async function claimOwnedLiveAttempt(reference:string,secret:string) {
 if(!/^BLING-[0-9a-f-]{36}$/.test(reference)||!/^[a-f0-9]{64}$/.test(secret))return null;
 const attempt=await liveAttempt(reference);if(!attempt||attempt.settlement_mode!=='auto')return null;
 const claim=randomUUID();const {data,error}=await supabaseAdmin.rpc('bling_claim_owned_payment',{
  p_reference:reference,p_claim:claim,p_secret_sha256:createHash('sha256').update(secret).digest('hex')});
 if(error)throw Error('Payment claim unavailable');if(data!==true)return null;
 const owned=await liveAttempt(reference);
 if(!owned||owned.payment_claim_id!==claim||owned.status!=='payment_processing')throw Error('Payment requires reconciliation');
 return {claim,attempt:owned};
}
