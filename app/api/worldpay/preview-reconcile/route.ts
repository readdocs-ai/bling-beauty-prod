/** Owner-protected read-only recovery for a claimed Try payment. Never marks paid. */
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {supabaseAdmin} from '@/lib/supabase';
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyWorldpayPayment} from '@/lib/worldpay-payment-query';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store'};
const schema=z.object({reference:z.string().regex(/^BLING-[0-9a-f-]{36}$/),ownershipSecret:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export async function POST(request:Request) {
 if(process.env.VERCEL_ENV!=='preview'||process.env.WORLDPAY_ENVIRONMENT!=='try')
   return NextResponse.json({error:'Unavailable'},{status:404,headers:noStore});
 if(Number(request.headers.get('content-length')||'0')>1024)
   return NextResponse.json({error:'Invalid request'},{status:413,headers:noStore});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Invalid request'},{status:400,headers:noStore});
 const {reference,ownershipSecret}=parsed.data;
 const {data:attempt,error}=await supabaseAdmin.from('bling_checkout_attempts')
  .select('reference,status,amount_pence,currency,payment_claim_id,browser_secret_sha256')
  .eq('reference',reference).maybeSingle();
 if(error || !attempt || !attempt.payment_claim_id || attempt.currency!=='GBP' ||
    !Number.isSafeInteger(attempt.amount_pence) || !/^[a-f0-9]{64}$/.test(attempt.browser_secret_sha256||''))
   return NextResponse.json({error:'Not found'},{status:404,headers:noStore});
 const digest=createHash('sha256').update(ownershipSecret).digest();
 const known=Buffer.from(attempt.browser_secret_sha256,'hex');
 if(!timingSafeEqual(digest,known))return NextResponse.json({error:'Not found'},{status:404,headers:noStore});
 try {
   const verification=await verifyWorldpayPayment(reference,attempt.amount_pence);
   return NextResponse.json({reference,status:attempt.status,
      providerState:verification.state,reason:verification.reason,
      action:'No automatic retry or fulfilment. Operator verification required.'},
      {status:200,headers:noStore});
 } catch {
   return NextResponse.json({reference,status:'unresolved',providerState:'uncertain',
      action:'Manual review required. Do not retry payment.'},{status:503,headers:noStore});
 }
}
