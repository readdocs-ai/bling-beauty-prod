import {NextResponse} from 'next/server';
import {z} from 'zod';
import {shippingAdminAllowed} from '@/lib/shipping/admin-route';
import {importPaidOrderToRoyalMail} from '@/lib/shipping/royal-mail-worker';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
const headers={'Cache-Control':'no-store'};
const schema=z.object({orderId:z.string().uuid(),weightGrams:z.number().int().min(1).max(30000),taxPence:z.number().int().min(0),packageFormat:z.enum(['smallParcel','mediumParcel','largeParcel','parcel'])}).strict();
export async function POST(request:Request){
 if(!await shippingAdminAllowed(request))return NextResponse.json({error:'Unauthorised'},{status:403,headers});
 const body=schema.safeParse(await request.json().catch(()=>null));
 if(!body.success)return NextResponse.json({error:'Check the order, measured weight, tax and parcel format.'},{status:400,headers});
 try{const {orderId,...packing}=body.data;return NextResponse.json({imported:true,...await importPaidOrderToRoyalMail(orderId,packing)},{headers});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Royal Mail import unavailable',retrySafe:!!e&&typeof e==='object'&&'retrySafe' in e&&e.retrySafe===true},{status:409,headers});}
}
