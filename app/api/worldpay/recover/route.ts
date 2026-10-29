import {timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {recoverSettlementInbox} from '@/lib/worldpay/settlement-worker';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET,got=request.headers.get('authorization')??'';
 const expected=secret?`Bearer ${secret}`:'';
 if(!secret||got.length!==expected.length||!timingSafeEqual(Buffer.from(got),Buffer.from(expected)))
  return NextResponse.json({error:'Unauthorised'},{status:401});
 const enabled=(process.env.VERCEL_ENV==='production'&&process.env.WORLDPAY_ENVIRONMENT==='live'&&process.env.BLING_LIVE_SETTLEMENT_EVENTS==='true');
 if(!enabled)return NextResponse.json({error:'Unavailable'},{status:404});
 try{return NextResponse.json({outcomes:await recoverSettlementInbox()},{headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({error:'Recovery unavailable'},{status:503});}
}
