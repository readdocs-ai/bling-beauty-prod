import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase';
export const dynamic='force-dynamic';
/** Customer polling is read-only. Only authenticated provider events can finalise payment. */
export async function GET(req:Request){
 const reference=new URL(req.url).searchParams.get('reference')??'';
 const headers={'Cache-Control':'private, no-store'};
 if(!/^BLING-[0-9a-f-]{36}$/.test(reference))return NextResponse.json({error:'Invalid reference'},{status:400,headers});
 const {data,error}=await supabaseAdmin.from('bling_checkout_attempts').select('status,payment_environment')
  .eq('reference',reference).maybeSingle();
 if(error)return NextResponse.json({status:'verification_unavailable'},{status:503,headers});
 const matches=data&&data.payment_environment===process.env.WORLDPAY_ENVIRONMENT;
 return NextResponse.json({status:matches&&data.status==='paid_verified'?'paid':'pending'},{headers});
}
