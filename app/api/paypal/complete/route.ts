import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { noStore, paypalBrowserRequest, paypalConfig, paypalId, readJson } from '@/lib/paypal/client';
import { completePayPalOrder, paypalCookie } from '@/lib/paypal/orders';

export async function POST(request: NextRequest) {
  const reply = (state: string, status: number) => NextResponse.json({ state }, { status, headers: noStore });
  const config = paypalConfig();
  if (!config) return reply('unavailable', 503);
  if (!paypalBrowserRequest(request, config)) return reply('missing', 403);
  const parsed = z.object({ orderId: paypalId }).safeParse(await readJson(request, 1024));
  if (!parsed.success) return reply('missing', 400);
  const { orderId } = parsed.data;
  const secret = request.cookies.get(paypalCookie(orderId))?.value;
  if (!secret || !/^[a-f0-9]{64}$/.test(secret)) return reply('missing', 404);
  try {
    const result = await completePayPalOrder(config, orderId, secret);
    return NextResponse.json(result, { status: result.state === 'missing' ? 404 : 200, headers: noStore });
  } catch {
    console.error('PayPal order confirmation pending review');
    return reply('unavailable', 503);
  }
}
