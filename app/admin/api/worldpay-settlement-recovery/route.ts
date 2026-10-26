import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {verifyAdminSession} from '@/lib/admin-session';
import {recoverSettlementInbox} from '@/lib/worldpay/settlement-worker';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function POST(request:Request){
 const session=(await cookies()).get('bbp_admin')?.value??'';
 if(!await verifyAdminSession(session)||request.headers.get('origin')!==new URL(request.url).origin)
  return NextResponse.json({error:'Unauthorised'},{status:403});
 if(process.env.VERCEL_ENV!=='preview'||process.env.BLING_PREVIEW_SETTLEMENT_EVENTS!=='true')
  return NextResponse.json({error:'Unavailable'},{status:404});
 try{return NextResponse.json({outcomes:await recoverSettlementInbox()},{headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({error:'Recovery unavailable'},{status:503});}
}
