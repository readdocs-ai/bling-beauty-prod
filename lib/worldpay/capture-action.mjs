/** Only full capture links obtained server-side from authenticated Worldpay responses.
 * Payment Queries documents follow-on Card Payments v7 links as well as Integrated links.
 */
import {safeIntegratedAction} from './integrated-payments-contract.mjs';
export function safeTryCaptureAction(href) {
  if(typeof href!=='string'||href.length>4096)throw Error('Capture action unavailable');
  const url=new URL(href,'https://try.access.worldpay.com');
  if(url.origin!=='https://try.access.worldpay.com'||url.username||url.password||url.search||url.hash)
    throw Error('Capture action rejected');
  if(url.pathname.startsWith('/api/payments/'))return {kind:'integrated',href:safeIntegratedAction(url.href,'settle')};
  if(/^\/payments\/settlements\/full\/[A-Za-z0-9%._~+:=\/-]+$/.test(url.pathname))return {kind:'card-v7',href:url.href};
  throw Error('Full capture action required');
}
export function resolveCaptureAction(attempt,details) {
  const stored=attempt.provider_actions?.settlePayment;
  if(stored)return safeTryCaptureAction(stored);
  const integrated=details?._actions?.settlePayment;
  if(integrated?.method==='POST')return safeTryCaptureAction(integrated.href);
  return safeTryCaptureAction(details?._links?.['cardPayments:settle']?.href);
}
