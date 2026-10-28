/** Issuer iframe return receiver. An unauthenticated callback is NEVER proof of 3DS success. */
import { supabaseAdmin } from '@/lib/supabase';
import { readIssuerReturn } from '@/lib/worldpay/issuer-return.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; frame-ancestors 'self'; script-src 'unsafe-inline'"};
function html(message: string, status: number) {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Bank authentication</title></head><body><p>${message}</p></body></html>`, {status, headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
export async function POST(request:Request) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.WORLDPAY_ENVIRONMENT !== 'try' ||
      process.env.BLING_PREVIEW_3DS_CHALLENGE_CONTINUATION !== 'true') return html('Authentication return is unavailable.',404);
  const result = await readIssuerReturn(request);
  if (!result.ok) {
    console.warn('Worldpay issuer return rejected',{reason:result.reason,...result.diagnostic});
    return html('Invalid authentication return.',result.status);
  }
  const {id} = result;
  console.info('Worldpay issuer return received',result.diagnostic);
  // TransactionId may be user-supplied. This only records that a matching callback was seen.
  // It MUST NOT set an order paid, approved, or authenticated.
  const {data,error} = await supabaseAdmin.rpc('bling_mark_issuer_challenge_return',{p_challenge_reference:id});
  if (error || data !== true) return html('Unable to confirm the authentication return. Contact support.',409);
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Bank authentication</title></head><body><p>Bank verification screen finished. Payment is not yet confirmed.</p><script>if(window.parent!==window){window.parent.postMessage({type:'bling-worldpay-issuer-return',challengeReference:${JSON.stringify(id)}},window.location.origin)}</script></body></html>`,{status:200,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
export async function GET(){return html('This endpoint accepts only bank authentication returns.',405);}
