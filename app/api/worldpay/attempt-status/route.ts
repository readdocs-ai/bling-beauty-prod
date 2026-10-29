import {liveRequestAllowed,liveAttempt} from '@/lib/worldpay/live-checkout';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCheckoutAttemptStatus } from '@/lib/worldpay/persistent-attempt';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers = { 'Cache-Control':'private, no-store' };
export async function POST(request: Request) {
  if(!liveRequestAllowed(request))return NextResponse.json({error:'Unavailable'},{status:404,headers});
  const parsed = z.object({
    reference: z.string().regex(/^BLING-[0-9a-f-]{36}$/),
    ownershipSecret: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error:'Invalid attempt credentials'},{status:400,headers});
  const attempt=await liveAttempt(parsed.data.reference);
  if(!attempt)return NextResponse.json({error:'Attempt unavailable'},{status:404,headers});
  const result = await getCheckoutAttemptStatus(parsed.data.reference, parsed.data.ownershipSecret);
  if (!result) return NextResponse.json({error:'Attempt unavailable'},{status:404,headers});
  return NextResponse.json({ ...result, amountPence:attempt.amount_pence,paymentEnabled:true },{headers});
}
