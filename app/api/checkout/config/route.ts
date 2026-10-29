import {NextResponse} from 'next/server';
import {previewReadiness} from '@/lib/worldpay/preview-readiness';
import {liveReadiness} from '@/lib/worldpay/live-policy.mjs';
import {getOrderingState} from '@/lib/order-switch';
export const dynamic='force-dynamic';
export async function GET(){
 const environment=process.env.VERCEL_ENV==='preview'&&process.env.WORLDPAY_ENVIRONMENT==='try'?'try':'live';
 let available=false;
 if(environment==='try')available=previewReadiness(process.env).readyForPaymentTesting;
 else if(liveReadiness(process.env).ready){const state=await getOrderingState();available=state.configured&&!state.suspended;}
 return NextResponse.json({environment,available},{headers:{'Cache-Control':'no-store'}});
}
