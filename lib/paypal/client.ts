import 'server-only';
import { z } from 'zod';

export const paypalId = z.string().regex(/^[A-Z0-9]{1,50}$/i);
const liveOrigins = new Set([
  'https://www.blingbeautyproducts.com', 'https://blingbeautyproducts.com',
  'https://www.blingbeautyproducts.co.uk', 'https://blingbeautyproducts.co.uk',
]);
export const noStore = { 'Cache-Control': 'no-store' };
export type PayPalConfig = NonNullable<ReturnType<typeof paypalConfig>>;

export function paypalConfig() {
  const deployment = process.env.VERCEL_ENV;
  const mode = process.env.PAYPAL_ENVIRONMENT;
  if (!(deployment === 'production' && mode === 'live') &&
      !((deployment === 'preview' || deployment === 'development') && mode === 'sandbox')) return null;
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const merchantId = process.env.PAYPAL_MERCHANT_ID?.trim();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  const site = process.env.PAYPAL_CHECKOUT_ORIGIN?.trim() || (mode === 'live' ? 'https://www.blingbeautyproducts.com' : undefined);
  if (!clientId || !secret || !merchantId || !webhookId || !site) return null;
  const previewReturnShare = deployment === 'preview' ? process.env.PAYPAL_PREVIEW_RETURN_SHARE_TOKEN?.trim() : undefined;
  if (previewReturnShare && !/^[a-z0-9_-]{32}$/i.test(previewReturnShare)) return null;
  let url: URL;
  try { url = new URL(site); } catch { return null; }
  if (url.protocol !== 'https:' || url.origin !== site || url.username || url.password) return null;
  const live = mode === 'live';
  if (live && !liveOrigins.has(url.origin)) return null;
  return {
    clientId, secret, merchantId, webhookId, origin: url.origin, previewReturnShare,
    api: live ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    approvalHost: live ? 'www.paypal.com' : 'www.sandbox.paypal.com',
    environment: live ? 'live' as const : 'try' as const,
  };
}

export function isPayPalCheckout() {
  return process.env.BLING_CHECKOUT_PROVIDER === 'paypal';
}

export function paypalBrowserRequest(request: Request, config: PayPalConfig) {
  const origin = new URL(request.url).origin;
  return request.headers.get('origin') === origin &&
    (config.environment === 'live' ? liveOrigins.has(origin) : origin === config.origin);
}

export async function readJson(request: Request, limit: number) {
  if (Number(request.headers.get('content-length') ?? '0') > limit) return null;
  const text = await request.text();
  if (Buffer.byteLength(text) > limit) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

export async function paypalApi(config: PayPalConfig) {
  const token = await fetch(config.api + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(config.clientId + ':' + config.secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
    redirect: 'error',
  });
  const { access_token: accessToken } = z.object({ access_token: z.string().min(1) })
    .parse(token.ok ? await token.json() : null);
  return async (path: string, body?: object, requestId?: string) => {
    const response = await fetch(config.api + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('PayPal request unavailable');
    return await response.json() as unknown;
  };
}
