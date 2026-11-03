/** Challenge continuation. Requires a database-recorded matching issuer callback.
 * The callback itself is NOT authentication evidence: only the Worldpay response can advance state.
 */
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {supabaseAdmin} from '@/lib/supabase';
import {claim3dsContinuation,record3dsContinuation} from '@/lib/worldpay/continuation-claims';
import {advanceChallenge} from '@/lib/worldpay/integrated-payments';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const schema=z.object({reference:z.string().regex(/^BLING-[0-9a-f-]{36}$/),ownershipSecret:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
function fail(status:number){return NextResponse.json({error:'Bank authentication is pending verification; do not retry the card payment.'},{status,headers});}
export async function POST(request:Request){
 if(process.env.VERCEL_ENV!=='preview'||process.env.WORLDPAY_ENVIRONMENT!=='try'||
    process.env.BLING_PREVIEW_PAYMENT_INITIATION!=='true'||
    process.env.BLING_PREVIEW_PAYMENT_OWNERSHIP_VERIFIED!=='true'||
    process.env.BLING_PREVIEW_3DS_CHALLENGE_CONTINUATION!=='true') return fail(404);
 if(Number(request.headers.get('content-length')||'0')>1024) return fail(413);
 const body=schema.safeParse(await request.json().catch(()=>null));
 if(!body.success)return fail(400);
 const {reference,ownershipSecret}=body.data;
 const {data:attempt,error}=await supabaseAdmin.from('bling_checkout_attempts')
  .select('payment_claim_id,status,provider_outcome').eq('reference',reference).maybeSingle();
 if(error||!attempt||attempt.status!=='payment_processing'||attempt.provider_outcome!=='challenge'||
    typeof attempt.payment_claim_id!=='string')return fail(409);
 let claimed;
 try{claimed=await claim3dsContinuation(reference,attempt.payment_claim_id,ownershipSecret,'challenge');}
 catch{return fail(503);}
 if(!claimed)return fail(409);
 // Single-use claim was durably taken. Worldpay POST with NO body as documented.
 try{
   const response=await advanceChallenge(claimed.action);
   const progress=await record3dsContinuation(reference,attempt.payment_claim_id,claimed.continuationClaim,response);
   return NextResponse.json({status:'payment_processing',providerStage:progress.outcome,
    message:'Bank authentication was submitted for verification. Payment is not yet confirmed.'},{status:202,headers});
 }catch{return fail(503);}
}
