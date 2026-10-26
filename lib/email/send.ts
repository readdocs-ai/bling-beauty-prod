/** Server-only email transport. No automatic sending is triggered by this module. */
import 'server-only';
import { buildEmail, type EmailKind, type EmailOrder } from './templates';
import {emailDeliverySettings} from './delivery-policy.mjs';

const FROM = 'Bling Beauty Products <info@blingbeautyproducts.com>';
const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendOrderEmail(kind: EmailKind, order: EmailOrder, options:{environment:'try'|'live';idempotencyKey:string}): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Email service is not configured');
  const draft = buildEmail(kind, order);
  const settings=emailDeliverySettings(process.env,options.environment,[draft.recipient]);
  if(!/^[A-Za-z0-9_/-]{1,256}$/.test(options.idempotencyKey))throw Error('Invalid delivery key');
  if (!ADDRESS.test(draft.recipient)) throw new Error('Invalid recipient email');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json','Idempotency-Key':options.idempotencyKey },
    body: JSON.stringify({ from: FROM, to: [draft.recipient], reply_to:'info@blingbeautyproducts.com', subject: settings.prefix+draft.subject,
      text:(options.environment==='try'?'TEST ONLY — no live order or real payment.\n\n':'')+draft.text }),
    cache: 'no-store',
    redirect:'error',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('id' in data) || typeof data.id !== 'string') {
    throw new Error('Email provider returned an invalid response');
  }
  return { id: data.id };
}
