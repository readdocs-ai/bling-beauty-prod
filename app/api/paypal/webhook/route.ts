import { NextResponse } from 'next/server';
import { z } from 'zod';
import { noStore, paypalApi, paypalConfig, paypalId, readJson } from '@/lib/paypal/client';
import { completePayPalOrder } from '@/lib/paypal/orders';

const eventShape = z.object({
  event_type: z.string(),
  resource: z.object({
    id: paypalId,
    supplementary_data: z.object({ related_ids: z.object({ order_id: paypalId }) }).optional(),
  }),
});

export async function POST(request: Request) {
  const config = paypalConfig();
  const reply = (status: number) => new NextResponse(null, { status, headers: noStore });
  if (!config) return reply(503);
  const raw = await readJson(request, 65536);
  if (!raw || typeof raw !== 'object' || !('event_type' in raw)) return reply(400);
  const approved = raw.event_type === 'CHECKOUT.ORDER.APPROVED';
  if (!approved && raw.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return reply(204);
  const parsed = eventShape.safeParse(raw);
  if (!parsed.success) return reply(400);
  const transmission = {
    auth_algo: request.headers.get('paypal-auth-algo'),
    cert_url: request.headers.get('paypal-cert-url'),
    transmission_id: request.headers.get('paypal-transmission-id'),
    transmission_sig: request.headers.get('paypal-transmission-sig'),
    transmission_time: request.headers.get('paypal-transmission-time'),
  };
  if (Object.values(transmission).some(value => !value)) return reply(400);

  try {
    const api = await paypalApi(config);
    const proof = z.object({ verification_status: z.string() }).parse(await api('/v1/notifications/verify-webhook-signature', {
      ...transmission, webhook_id: config.webhookId, webhook_event: raw,
    }));
    if (proof.verification_status !== 'SUCCESS') {
      console.warn('PayPal webhook signature rejected');
      return reply(401);
    }
    const resource = parsed.data.resource;
    const orderId = approved ? resource.id : resource.supplementary_data?.related_ids.order_id;
    if (!orderId) return reply(400);
    const result = await completePayPalOrder(config, orderId, undefined, approved ? undefined : resource.id);
    console.info('PayPal webhook verified', { event: raw.event_type, state: result.state });
    return reply(result.state === 'pending' ? 503 : 204);
  } catch {
    console.error('PayPal webhook processing pending review');
    return reply(503);
  }
}
