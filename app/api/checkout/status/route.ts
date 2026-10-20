import { NextResponse } from 'next/server';
import { finalisePayment, processPaidOrderEmails } from '@/lib/paid-order-finalisation';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const reference=new URL(req.url).searchParams.get('reference')??'';
 if(!/^BLING-[0-9a-f-]{36}$/.test(reference))return NextResponse.json({error:'Invalid reference'},{status:400});
 try{
  const result=await finalisePayment(reference);
  if(result.state==='paid' && result.orderId){
   // Payment is committed before side effects; failed email does not undo a paid order.
   await processPaidOrderEmails(result.orderId).catch(()=>undefined);
  }
  return NextResponse.json({status:result.state},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({status:'verification_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
