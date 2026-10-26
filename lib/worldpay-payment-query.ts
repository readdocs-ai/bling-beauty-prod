import 'server-only';
import { classifyPaymentQuery } from './worldpay/reconciliation-policy.mjs';

export type WorldpayVerification = {state:'pending'|'failed'|'uncertain';reason:string;paymentId?:string;event?:string};
/** Detailed lookup URL is built from a checked payment ID, never from browser/provider links. */
export async function queryWorldpayPaymentDetails(paymentId:string):Promise<unknown> {
  if(!/^[A-Za-z0-9_-]{3,128}$/.test(paymentId))throw Error('Invalid payment ID');
  if(process.env.VERCEL_ENV!=='preview'||process.env.WORLDPAY_ENVIRONMENT!=='try')throw Error('Preview only');
  const user=process.env.WORLDPAY_API_USERNAME?.trim(),password=process.env.WORLDPAY_API_PASSWORD?.trim();
  if(!user||!password)throw Error('Worldpay credentials unavailable');
  const response=await fetch(`https://try.access.worldpay.com/paymentQueries/payments/${encodeURIComponent(paymentId)}`,{
    headers:{Authorization:`Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,Accept:'application/vnd.worldpay.payment-queries-v1.hal+json'},
    cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000),
  });
  if(response.status!==200)throw Error('Detailed provider query unavailable');
  return response.json();
}
/** Query-only: never mutate order state from an aggregate/possibly delayed result. */
export async function verifyWorldpayPayment(reference:string, amountPence:number):Promise<WorldpayVerification> {
  if (!/^BLING-[0-9a-f-]{36}$/.test(reference) || !Number.isSafeInteger(amountPence) || amountPence < 1) throw Error('Invalid order');
  const username=process.env.WORLDPAY_API_USERNAME?.trim();
  const password=process.env.WORLDPAY_API_PASSWORD?.trim();
  const entity=process.env.WORLDPAY_ENTITY?.trim();
  const environment=process.env.WORLDPAY_ENVIRONMENT;
  if (!username || !password || !entity) throw Error('Worldpay account not configured');
  if (environment !== 'try' && environment !== 'live') throw Error('Worldpay environment invalid');
  if (process.env.VERCEL_ENV === 'production' && environment !== 'live') throw Error('Production provider mismatch');
  const base=environment === 'try' ? 'https://try.access.worldpay.com' : 'https://access.worldpay.com';
  const response=await fetch(`${base}/paymentQueries/payments?transactionReference=${encodeURIComponent(reference)}`,{
    headers:{Authorization:`Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,Accept:'application/vnd.worldpay.payment-queries-v1.hal+json'},
    cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error(`Worldpay query unavailable (${response.status})`);
  const body:unknown=await response.json();
  return classifyPaymentQuery(body,{reference,amountPence,entity}) as WorldpayVerification;
}
