import 'server-only';
import {accessConfiguration} from './access-client';
import {safeTryCaptureAction,type CaptureAction} from './capture-action.mjs';
/** Capture only an already matched, server-held full-settlement action. Never retry. */
export async function requestVerifiedCapture(action:CaptureAction,paymentId:string){
  const checked=safeTryCaptureAction(action.href);
  if(checked.kind!==action.kind||!/^[A-Za-z0-9_-]{3,128}$/.test(paymentId))throw Error('Invalid capture');
  const {username,password}=accessConfiguration();
  const modular=checked.kind==='card-v7';
  const response=await fetch(checked.href,{
    method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      Accept:modular?'application/vnd.worldpay.payments-v7+json':'application/json',
      ...(modular?{'Content-Type':'application/vnd.worldpay.payments-v7+json'}:{'WP-Api-Version':'2024-06-01'}),
    },redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
  });
  const raw:unknown=await response.json().catch(()=>null);
  let data:Record<string,unknown>=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
  // Modular 202 acknowledges submission, not settlement. Bind it to the expected payment ID.
  if(modular && response.status===202 && data.paymentId===paymentId && typeof data.commandId==='string' &&
     /^[A-Za-z0-9_-]{3,128}$/.test(data.commandId))data={outcome:'sentForSettlement'};
  else if(modular)data={};
  return {httpStatus:response.status,data,correlationId:response.headers.get('WP-CorrelationId')};
}
