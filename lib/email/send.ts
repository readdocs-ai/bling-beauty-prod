/** Server-only email transport. No automatic sending is triggered by this module. */
import 'server-only';
import { buildEmail, type EmailKind, type EmailOrder } from './templates';

const FROM = 'Bling Beauty Products <info@blingbeautyproducts.com>';
const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendOrderEmail(kind: EmailKind, order: EmailOrder): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Email service is not configured');
  const draft = buildEmail(kind, order);
  if (!ADDRESS.test(draft.recipient)) throw new Error('Invalid recipient email');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [draft.recipient], subject: draft.subject, text: draft.text }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('id' in data) || typeof data.id !== 'string') {
    throw new Error('Email provider returned an invalid response');
  }
  return { id: data.id };
}
