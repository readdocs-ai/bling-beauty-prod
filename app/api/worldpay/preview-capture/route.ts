/** Owner-protected capture of an existing, independently matched Try authorisation.
 * Disabled until the additive capture RPC migration has been tested and enabled.
 */
import {NextResponse} from 'next/server';
import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {supabaseAdmin} from '@/lib/supabase';
import {captureOwnedAttempt} from '@/lib/worldpay/capture-coordinator.mjs';
import {requestVerifiedCapture} from '@/lib/worldpay/capture-transport';
import {queryWorldpayPaymentDetails,verifyWorldpayPayment} from '@/lib/worldpay-payment-query';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const schema=z.object({reference:z.string().regex(/^BLING-[0-9a-f-]{36}$/),ownershipSecret:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export async function POST(request:Request){
  if(process.env.VERCEL_ENV!=='preview'||process.env.WORLDPAY_ENVIRONMENT!=='try'||
     process.env.BLING_PREVIEW_PAYMENT_OWNERSHIP_VERIFIED!=='true'||process.env.BLING_PREVIEW_CAPTURE!=='true')
    return NextResponse.json({error:'Preview capture is disabled'},{status:404,headers});
  const entity=process.env.WORLDPAY_ENTITY?.trim();
  if(!entity)return NextResponse.json({error:'Capture unavailable'},{status:503,headers});
  if(Number(request.headers.get('content-length')||0)>1024)return NextResponse.json({error:'Invalid request'},{status:413,headers});
  const input=schema.safeParse(await request.json().catch(()=>null));
  if(!input.success)return NextResponse.json({error:'Invalid request'},{status:400,headers});
  try{
    const result=await captureOwnedAttempt(input.data,{
      entity,
      async readOwned(reference,secret){
        const {data,error}=await supabaseAdmin.from('bling_checkout_attempts').select(
          'status,settlement_mode,provider_outcome,provider_continuation_claim,currency,amount_pence,payment_claim_id,provider_actions,browser_secret_sha256'
        ).eq('reference',reference).maybeSingle();
        if(error)throw Error('Capture database unavailable');
        if(!data||!/^[a-f0-9]{64}$/.test(data.browser_secret_sha256??''))return null;
        if(!timingSafeEqual(Buffer.from(data.browser_secret_sha256,'hex'),createHash('sha256').update(secret).digest()))return null;
        return data;
      },
      verify:verifyWorldpayPayment,details:queryWorldpayPaymentDetails,
      async claim(input,attempt,paymentId,action){
        const captureClaim=randomUUID();
        const {data,error}=await supabaseAdmin.rpc('bling_claim_settlement',{
          p_reference:input.reference,p_payment_claim:attempt.payment_claim_id,
          p_secret_sha256:createHash('sha256').update(input.ownershipSecret).digest('hex'),
          p_capture_claim:captureClaim,p_verified_payment_id:paymentId,p_verified_amount:attempt.amount_pence,p_verified_action:action,
        });
        if(error)throw Error('Capture claim unavailable');
        return data&&typeof data.action==='string' ? {action:data.action,captureClaim,paymentClaim:attempt.payment_claim_id}:null;
      },
      settle:requestVerifiedCapture,
      async record(reference,claim,progress){
        const {data,error}=await supabaseAdmin.rpc('bling_store_settlement_progress',{
          p_reference:reference,p_payment_claim:claim.paymentClaim,p_capture_claim:claim.captureClaim,
          p_outcome:progress.outcome,p_actions:progress.actions,p_correlation:progress.correlationId,
        });
        if(error)throw Error('Capture progress unavailable');
        return data===true;
      },
    });
    return NextResponse.json({state:result.state,message:result.state==='settlement_requested'
      ? 'Capture requested. The order is awaiting verified settlement.'
      : 'Capture is not confirmed. Do not submit another payment or capture request.'},
      {status:result.state==='settlement_requested'?202:409,headers});
  }catch{return NextResponse.json({state:'uncertain',error:'Capture is unresolved. Do not retry payment or capture.'},{status:503,headers});}
}
