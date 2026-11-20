import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { processPaidOrderEmails } from '@/lib/paid-order-finalisation';
import { customerOrderNumber } from '@/lib/order-number.mjs';
import { paypalApi, paypalId, type PayPalConfig } from './client';

const money = z.object({ currency_code: z.literal('GBP'), value: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/) });
const orderSchema = z.object({
  id: paypalId,
  status: z.string(),
  purchase_units: z.array(z.object({
    reference_id: z.string(),
    invoice_id: z.string(),
    amount: money,
    payee: z.object({ merchant_id: z.string() }),
    payments: z.object({
      captures: z.array(z.object({ id: paypalId, status: z.string(), amount: money })),
    }).optional(),
  })).length(1),
});

export const paypalCookie = (id: string) => 'bling_paypal_' + id;
export const ownershipHash = (secret: string) => createHash('sha256').update(secret).digest('hex');
export const pounds = (pence: number) => (pence / 100).toFixed(2);

export async function completePayPalOrder(config: PayPalConfig, orderId: string, ownership?: string, eventCaptureId?: string) {
  let query = supabaseAdmin.from('bling_checkout_attempts')
    .select('reference,amount_pence,currency,paypal_order_id')
    .eq('paypal_order_id', orderId).eq('payment_environment', config.environment);
  if (ownership !== undefined) query = query.eq('browser_secret_sha256', ownershipHash(ownership));
  const { data: attempt, error } = await query.maybeSingle();
  if (error) throw new Error('Checkout record unavailable');
  if (!attempt) return { state: 'missing' as const };
  const api = await paypalApi(config);
  const path = '/v2/checkout/orders/' + orderId;
  const { reference, amount_pence: amount, currency } = attempt;

  function checkedOrder(raw: unknown) {
    const order = orderSchema.parse(raw);
    const [unit] = order.purchase_units;
    if (order.id !== orderId || unit.reference_id !== reference || unit.invoice_id !== reference ||
        currency !== 'GBP' || Math.round(Number(unit.amount.value) * 100) !== amount || unit.payee.merchant_id !== config.merchantId) {
      throw new Error('PayPal order details did not match');
    }
    return { order, unit };
  }

  let result = checkedOrder(await api(path));
  if (result.order.status === 'APPROVED' && !eventCaptureId && !result.unit.payments?.captures.length) {
    try {
      await api(path + '/capture', {}, 'capture-' + orderId);
    } catch {
      // The provider may have captured payment before the response was lost.
    }
    result = checkedOrder(await api(path));
  }
  const captures = result.unit.payments?.captures ?? [];
  const capture = captures[0];
  if (!capture || capture.status !== 'COMPLETED' || result.order.status !== 'COMPLETED') return { state: 'pending' as const };
  if (captures.length !== 1 || Math.round(Number(capture.amount.value) * 100) !== amount || (eventCaptureId && eventCaptureId !== capture.id)) {
    throw new Error('PayPal capture details did not match');
  }

  const { data: savedOrderId, error: commitError } = await supabaseAdmin.rpc('bling_commit_paypal_capture', {
    p_reference: attempt.reference,
    p_paypal_order_id: orderId,
    p_capture_id: capture.id,
    p_environment: config.environment,
    p_amount: attempt.amount_pence,
  });
  if (commitError || typeof savedOrderId !== 'string') throw new Error('PayPal capture could not be recorded');
  const { data: saved, error: savedError } = await supabaseAdmin.from('bling_paid_orders')
    .select('reference,order_number').eq('id', savedOrderId).single();
  if (savedError || !saved) throw new Error('Order confirmation unavailable');
  await processPaidOrderEmails(savedOrderId);
  return { state: 'paid' as const, orderNumber: customerOrderNumber(saved) };
}
