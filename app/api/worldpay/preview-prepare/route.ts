/** Preview-only, non-charging checkout preparation. Does not call Worldpay or enable live orders. */
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { luxuryItems } from '@/lib/luxury-catalogue';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const fail = (message: string, status: number) => NextResponse.json({error:message},{status,headers});
const schema = z.object({
  items: z.array(z.object({slug:z.string().min(1).max(150),quantity:z.number().int().min(1).max(10)}).strict()).min(1).max(20),
  customer:z.object({name:z.string().trim().min(2).max(120),email:z.string().email().max(254),phone:z.string().max(40).optional()}).strict(),
  shipping:z.object({address1:z.string().trim().min(3).max(150),address2:z.string().max(150).optional(),city:z.string().trim().min(2).max(100),postcode:z.string().trim().min(3).max(16),country:z.literal('GB')}).strict(),
}).strict();

export async function POST(request:Request) {
  // Separate from the live /api/checkout route, and disabled by default.
  if (process.env.VERCEL_ENV !== 'preview' || process.env.WORLDPAY_ENVIRONMENT !== 'try' ||
      process.env.BLING_PREVIEW_CHECKOUT_PREPARATION !== 'true') return fail('Preview preparation is disabled',503);
  const checkoutId = process.env.WORLDPAY_CHECKOUT_ID?.trim();
  if (!checkoutId || !/^[A-Za-z0-9_-]{8,150}$/.test(checkoutId)) return fail('Worldpay checkout configuration unavailable',503);
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return fail('Check your basket and delivery details',400);
  const catalogue = new Map(luxuryItems.map(item=>[item.slug,item]));
  const qty = new Map<string,number>();
  for(const item of parsed.data.items) {
    if (!catalogue.has(item.slug)) return fail('A product is unavailable',400);
    const count=(qty.get(item.slug) ?? 0)+item.quantity;
    if(count>10) return fail('Maximum 10 per product',400);
    qty.set(item.slug,count);
  }
  const lines=[...qty].map(([slug,quantity])=>{
    const item=catalogue.get(slug)!;
    const unitPence=Math.round(item.sellingPrice*100);
    return {slug,name:item.name,quantity,unitPence,lineTotalPence:unitPence*quantity};
  });
  const amount=lines.reduce((sum,line)=>sum+line.lineTotalPence,0);
  if(!Number.isSafeInteger(amount) || amount<1 || amount>1000000) return fail('Invalid order amount',400);
  const reference=`BLING-${randomUUID()}`;
  const ownershipSecret=randomBytes(32).toString('hex');
  const ownershipHash=createHash('sha256').update(ownershipSecret).digest('hex');
  try {
    const {error}=await supabaseAdmin.from('bling_checkout_attempts').insert({
      reference,status:'pending',amount_pence:amount,currency:'GBP',items:lines,
      customer:parsed.data.customer,shipping:parsed.data.shipping,browser_secret_sha256:ownershipHash,
    });
    if(error) return fail('Preview database preparation unavailable',503);
  } catch { return fail('Preview database preparation unavailable',503); }
  return NextResponse.json({reference,ownershipSecret,checkoutId,status:'pending'}, {headers});
}
