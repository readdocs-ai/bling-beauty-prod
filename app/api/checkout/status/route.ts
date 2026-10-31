import {customerOrderNumber} from '@/lib/order-number.mjs';
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
 const paid=matches&&data.status==='paid_verified';
 let orderNumber:string|undefined;
 if(paid){
  const order=await supabaseAdmin.from('bling_paid_orders').select('order_number').eq('reference',reference).eq('payment_environment',process.env.WORLDPAY_ENVIRONMENT).eq('status','paid').maybeSingle();
  if(!order.error&&order.data)orderNumber=customerOrderNumber(order.data)||undefined;
 }
 return NextResponse.json({status:paid?'paid':'pending',...(orderNumber?{orderNumber}:{})},{headers});
}
