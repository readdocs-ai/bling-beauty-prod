import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {verifyAdminSession} from '@/lib/admin-session';
import {supabaseAdmin} from '@/lib/supabase';
import {verifyWorldpayPayment} from '@/lib/worldpay-payment-query';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
const schema=z.object({reference:z.string().regex(/^BLING-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)}).strict();
/** Admin-only, fixed provider query. No payment POSTs or database mutations. */
export async function POST(request:Request){
 if(!await verifyAdminSession((await cookies()).get('bbp_admin')?.value??''))return NextResponse.json({error:'Unauthorised'},{status:401,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Forbidden'},{status:403,headers});
 if(process.env.VERCEL_ENV!=='production'||process.env.WORLDPAY_ENVIRONMENT!=='live')return NextResponse.json({error:'Live check unavailable'},{status:403,headers});
 if(Number(request.headers.get('content-length')??0)>2048)return NextResponse.json({error:'Invalid request'},{status:413,headers});
 const body=schema.safeParse(await request.json().catch(()=>null));
 if(!body.success)return NextResponse.json({error:'Enter a valid Bling order reference'},{status:400,headers});
 const {data:a,error}=await supabaseAdmin.from('bling_checkout_attempts').select('reference,amount_pence,payment_environment,status,provider_outcome').eq('reference',body.data.reference).eq('payment_environment','live').maybeSingle();
 if(error||!a)return NextResponse.json({error:'Live attempt unavailable'},{status:404,headers});
 try{
  const result=await verifyWorldpayPayment(a.reference,a.amount_pence);
  return NextResponse.json({reference:a.reference,amountPence:a.amount_pence,storedStatus:a.status,storedProviderStage:a.provider_outcome,...result},{headers});
 }catch(error){
  const message=error instanceof Error?error.message:'';
  const status=message.match(/^Worldpay query unavailable \(([0-9]{3})\)$/)?.[1];
  return NextResponse.json({error:status?`Worldpay query unavailable (HTTP ${status}). No payment was retried.`:'Worldpay query unavailable. No payment was retried.'},{status:503,headers});
 }
}
