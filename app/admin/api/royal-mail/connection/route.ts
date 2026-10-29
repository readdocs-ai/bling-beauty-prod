import {NextResponse} from 'next/server';
import {shippingAdminAllowed} from '@/lib/shipping/admin-route';
import {checkClickDropConnection} from '@/lib/royal-mail-click-drop';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!await shippingAdminAllowed(request))return NextResponse.json({error:'Unauthorised'},{status:403,headers});
 try{return NextResponse.json(await checkClickDropConnection(),{headers});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Royal Mail connection unavailable'},{status:503,headers});}
}
