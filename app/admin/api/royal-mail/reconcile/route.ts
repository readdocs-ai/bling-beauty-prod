import {NextResponse} from 'next/server';
import {z} from 'zod';
import {shippingAdminAllowed} from '@/lib/shipping/admin-route';
import {reconcileRoyalMailImport} from '@/lib/shipping/royal-mail-worker';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!await shippingAdminAllowed(request))return NextResponse.json({error:'Unauthorised'},{status:403,headers});
 const body=z.object({orderId:z.string().uuid()}).strict().safeParse(await request.json().catch(()=>null));
 if(!body.success)return NextResponse.json({error:'Invalid order'},{status:400,headers});
 try{return NextResponse.json(await reconcileRoyalMailImport(body.data.orderId),{headers});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Check unavailable'},{status:409,headers});}
}
