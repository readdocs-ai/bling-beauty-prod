import { randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderingState } from '@/lib/order-switch';
import { luxuryItems } from '@/lib/luxury-catalogue';
import { supabaseAdmin } from '@/lib/supabase';
import { isPayPalCheckout, noStore, paypalApi, paypalBrowserRequest, paypalConfig, paypalId, readJson } from '@/lib/paypal/client';
import { ownershipHash, paypalCookie, pounds } from '@/lib/paypal/orders';

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const checkout = z.object({
  items: z.array(z.object({ slug: text(1, 150), quantity: z.number().int().min(1).max(10) })).min(1).max(20),
  customer: z.object({ name: text(2, 120), email: z.email().max(254), phone: text(0, 40).optional() }),
  shipping: z.object({
    address1: text(3, 150), address2: text(0, 150).optional(), city: text(2, 100),
    postcode: text(3, 16), country: z.literal('GB'),
  }),
});
const createdOrder = z.object({
  id: paypalId,
  links: z.array(z.object({ rel: z.string(), href: z.string() })),
});
const approvedSlugs = new Set(luxuryItems.map(product => product.slug));
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

export async function POST(request: Request) {
  const config = paypalConfig();
  if (!isPayPalCheckout() || !config) return fail('PayPal checkout is temporarily unavailable.', 503);
  if (!paypalBrowserRequest(request, config)) return fail('Please open checkout at ' + config.origin + '/cart.', 403);
  const origin = new URL(request.url).origin;
  const returnUrl = new URL('/paypal/return', origin);
  const cancelUrl = new URL('/cart?paypal=cancelled', origin);
  if (config.previewReturnShare) {
    returnUrl.searchParams.set('_vercel_share', config.previewReturnShare);
    cancelUrl.searchParams.set('_vercel_share', config.previewReturnShare);
  }
  try {
    const state = await getOrderingState();
    if (!state.configured || state.suspended) return fail('New orders are temporarily unavailable.', 503);
    const parsed = checkout.safeParse(await readJson(request, 8192));
    if (!parsed.success) return fail('Check your basket and UK delivery details.', 400);
    const { items, customer, shipping } = parsed.data;
    const quantities = new Map<string, number>();
    for (const item of items) {
      const total = (quantities.get(item.slug) ?? 0) + item.quantity;
      if (!approvedSlugs.has(item.slug) || total > 10) return fail('Check the products and quantities in your basket.', 400);
      quantities.set(item.slug, total);
    }
    const { data: products, error } = await supabaseAdmin.from('products')
      .select('slug,name,price_gbp').in('slug', [...quantities.keys()]).eq('is_active', true);
    if (error || !products || products.length !== quantities.size) return fail('A product is currently unavailable.', 409);
    const lines = products.map(product => ({
      slug: product.slug, name: product.name as string,
      quantity: quantities.get(product.slug)!, unitPence: Math.round(Number(product.price_gbp) * 100),
    }));
    const amount = lines.reduce((sum, line) => sum + line.quantity * line.unitPence, 0);
    if (lines.some(line => !Number.isSafeInteger(line.unitPence) || line.unitPence <= 0 ||
        typeof line.name !== 'string' || !line.name.trim() || line.name.length > 127) ||
        !Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) return fail('Invalid basket total.', 400);

    const reference = 'BLING-' + randomUUID();
    const secret = randomBytes(32).toString('hex');
    const { error: insertError } = await supabaseAdmin.from('bling_checkout_attempts').insert({
      reference, status: 'pending', amount_pence: amount, currency: 'GBP', items: lines, customer, shipping,
      payment_environment: config.environment, browser_secret_sha256: ownershipHash(secret),
    });
    if (insertError) throw new Error('Checkout persistence failed');

    const api = await paypalApi(config);
    const order = createdOrder.parse(await api('/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: reference, invoice_id: reference, payee: { merchant_id: config.merchantId },
        amount: {
          currency_code: 'GBP', value: pounds(amount),
          breakdown: { item_total: { currency_code: 'GBP', value: pounds(amount) } },
        },
        items: lines.map(line => ({
          name: line.name, sku: line.slug, quantity: String(line.quantity), category: 'PHYSICAL_GOODS',
          unit_amount: { currency_code: 'GBP', value: pounds(line.unitPence) },
        })),
        shipping: {
          name: { full_name: customer.name },
          address: {
            address_line_1: shipping.address1, ...(shipping.address2 ? { address_line_2: shipping.address2 } : {}),
            admin_area_2: shipping.city, postal_code: shipping.postcode, country_code: shipping.country,
          },
        },
      }],
      payment_source: {
        paypal: { experience_context: {
          brand_name: 'Bling Beauty Products Ltd', user_action: 'PAY_NOW', shipping_preference: 'SET_PROVIDED_ADDRESS',
          return_url: returnUrl.href, cancel_url: cancelUrl.href,
        }},
      },
    }, reference.slice(6)));
    const link = order.links.find(entry => entry.rel === 'payer-action' || entry.rel === 'approve');
    if (!link) throw new Error('PayPal approval unavailable');
    const url = new URL(link.href);
    if (url.protocol !== 'https:' || url.host !== config.approvalHost || url.username || url.password ||
        url.searchParams.get('token') !== order.id) throw new Error('Invalid PayPal approval');
    const { error: updateError } = await supabaseAdmin.from('bling_checkout_attempts')
      .update({ paypal_order_id: order.id }).eq('reference', reference);
    if (updateError) throw new Error('Checkout persistence failed');
    const response = NextResponse.json({ approvalUrl: url.href }, { headers: noStore });
    response.cookies.set(paypalCookie(order.id), secret, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/api/paypal/complete', maxAge: 60 * 60 * 24,
    });
    return response;
  } catch {
    console.error('PayPal checkout start failed');
    return fail('PayPal checkout could not start. Please try again.', 503);
  }
}
