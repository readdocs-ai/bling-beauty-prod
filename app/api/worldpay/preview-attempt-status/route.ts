import { NextResponse } from 'next/server';
import { getCheckoutAttemptStatus } from '@/lib/worldpay/persistent-attempt';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers = { 'Cache-Control':'private, no-store' };
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.WORLDPAY_ENVIRONMENT !== 'try' ||
      process.env.BLING_PREVIEW_CHECKOUT_PREPARATION !== 'true')
    return NextResponse.json({error:'Unavailable'},{status:404,headers});
  const body: unknown = await request.json().catch(()=>null);
  if (!body || typeof body !== 'object' || !('reference' in body) ||
      typeof body.reference !== 'string' || body.reference.length > 50)
    return NextResponse.json({error:'Invalid reference'},{status:400,headers});
  const result = await getCheckoutAttemptStatus(body.reference);
  if (!result) return NextResponse.json({error:'Attempt unavailable'},{status:404,headers});
  return NextResponse.json({ ...result, paymentEnabled:false },{headers});
}
