import {NextResponse,after} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase';
import {boundedEventBody,verifyEventSignature,parseSettledEvent} from '@/lib/worldpay/settlement-events.mjs';
import {processSettlementEvent} from '@/lib/worldpay/settlement-worker';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 // Preview-only until the complete Live release is separately configured and approved.
 if(process.env.VERCEL_ENV!=='preview'||process.env.WORLDPAY_ENVIRONMENT!=='try'||process.env.BLING_PREVIEW_SETTLEMENT_EVENTS!=='true')
  return NextResponse.json({error:'Unavailable'},{status:404,headers});
 let keys:Record<string,string>;
 try{keys=JSON.parse(process.env.WORLDPAY_EVENT_SIGNING_KEYS??'');if(!keys||typeof keys!=='object'||Array.isArray(keys)||!Object.keys(keys).length)throw Error();}
 catch{return NextResponse.json({error:'Event verification unavailable'},{status:503,headers});}
 let raw:Buffer;
 try{raw=await boundedEventBody(request);}catch{return NextResponse.json({error:'Invalid body'},{status:400,headers});}
 if(!verifyEventSignature(raw,request.headers.get('event-signature'),keys))return NextResponse.json({error:'Invalid signature'},{status:400,headers});
 try{
  const event=parseSettledEvent(raw,'try');
  if(!event)return NextResponse.json({received:true},{headers});
  const {error}=await supabaseAdmin.from('bling_worldpay_settlement_events').insert(event);
  if(error&&error.code!=='23505')throw Error('Inbox unavailable');
  if(error){
   const {data:stored,error:readError}=await supabaseAdmin.from('bling_worldpay_settlement_events')
    .select('body_sha256').eq('environment',event.environment).eq('event_id',event.event_id).single();
   if(readError)throw Error('Inbox unavailable');
   if(stored?.body_sha256!==event.body_sha256)return NextResponse.json({error:'Conflicting event'},{status:409,headers});
  }
  // Receipt is durable before acknowledgement. Payment/email processing does not delay Worldpay's 10-second acknowledgement.
  after(async()=>{try{await processSettlementEvent(event);}catch{console.error('Worldpay settlement requires review');}});
  return NextResponse.json({received:true},{headers});
 }catch{return NextResponse.json({error:'Unable to accept event'},{status:503,headers});}
}
