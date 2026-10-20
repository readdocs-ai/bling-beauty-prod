/** Server-only email dispatch for orders that have already been independently verified as paid.
 * Not wired into checkout yet. Requires order_email_deliveries migration.
 */
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderEmail } from './send';
import type { EmailKind, EmailOrder } from './templates';

type PaidEmailKind = Extract<EmailKind, 'payment-confirmed' | 'admin-alert'>;

/** Never trust caller-supplied payment state: re-read the authoritative order. */
export async function sendVerifiedPaidOrderEmail(orderId: string, kind: PaidEmailKind, order: EmailOrder) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    throw new Error('Invalid order identifier');
  }
  const { data: stored, error: readError } = await supabaseAdmin.from('orders')
    .select('id,status,payment_provider,payment_verified_at,customer_email')
    .eq('id', orderId).single();
  if (readError || !stored || stored.status !== 'paid' || stored.payment_provider !== 'worldpay' || !stored.payment_verified_at) {
    throw new Error('Order payment is not verified');
  }
  if (typeof stored.customer_email !== 'string' || stored.customer_email.toLowerCase() !== order.customerEmail.toLowerCase()) {
    throw new Error('Email recipient does not match order');
  }
  // Reservation is unique per order and email type. Concurrent callers cannot send twice.
  const { error: reserveError } = await supabaseAdmin.from('order_email_deliveries').insert({
    order_id: orderId, email_kind: kind, status: 'reserved',
  });
  if (reserveError) {
    if (reserveError.code === '23505') return { skipped: true as const };
    throw new Error('Unable to reserve email delivery');
  }
  try {
    const result = await sendOrderEmail(kind, order);
    await supabaseAdmin.from('order_email_deliveries')
      .update({ status: 'sent', resend_message_id: result.id, updated_at: new Date().toISOString() })
      .eq('order_id', orderId).eq('email_kind', kind);
    return { skipped: false as const, providerMessageId: result.id };
  } catch (err) {
    await supabaseAdmin.from('order_email_deliveries')
      .update({ status: 'failed', last_error: err instanceof Error ? err.message.slice(0, 300) : 'Unknown error', updated_at: new Date().toISOString() })
      .eq('order_id', orderId).eq('email_kind', kind);
    throw err;
  }
}
