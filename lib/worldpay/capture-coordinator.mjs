/** Capture a previously authorised payment once. All gateways are server-owned.
 * No browser amount, merchant identity or provider action link is accepted.
 * A capture submission is progress, never settled/paid evidence.
 */
import {checkedProviderResult} from './integrated-payments-contract.mjs';
import {resolveCaptureAction,safeTryCaptureAction} from './capture-action.mjs';
export function matchesCaptureDetails(payment,expected) {
  if(!payment || payment.paymentId!==expected.paymentId || payment.transactionReference!==expected.reference ||
      payment.entity!==expected.entity || payment.value?.amount!==expected.amountPence ||
      payment.value?.currency!=='GBP' || payment.lastEvent!=='authorizationSucceeded' ||
      !Array.isArray(payment.events) || !payment.events.some(e=>e?.eventName==='authorizationSucceeded'))return false;
  // Unknown later commands, partial captures and refund/cancellation histories stop capture.
  return payment.events.every(e=>['authorizationRequested','authorizationSucceeded'].includes(e?.eventName));
}
export async function captureOwnedAttempt(input,gateways) {
  if(!/^BLING-[0-9a-f-]{36}$/.test(input?.reference??'') || !/^[a-f0-9]{64}$/.test(input?.ownershipSecret??''))
    return {state:'unavailable'};
  const attempt=await gateways.readOwned(input.reference,input.ownershipSecret);
  if(!attempt || attempt.status!=='payment_processing' || attempt.provider_outcome!=='authorised' ||
      attempt.provider_continuation_claim || attempt.currency!=='GBP' || !Number.isSafeInteger(attempt.amount_pence) ||
      attempt.amount_pence<1 || typeof attempt.payment_claim_id!=='string')return {state:'unavailable'};
  // Independent provider lookup precedes the irreversible capture claim.
  const summary=await gateways.verify(input.reference,attempt.amount_pence);
  if(summary.state!=='pending' || summary.event!=='authorizationsucceeded' ||
      !/^[A-Za-z0-9_-]{3,128}$/.test(summary.paymentId??''))return {state:'unverified'};
  const expected={reference:input.reference,amountPence:attempt.amount_pence,entity:gateways.entity,paymentId:summary.paymentId};
  const details=await gateways.details(summary.paymentId);
  if(!matchesCaptureDetails(details,expected))return {state:'unverified'};
  // Validate action before consuming a claim, then require the same stored action from the atomic claim.
  let action;
  try{action=resolveCaptureAction(attempt,details);}catch{return {state:'missing_action'};}
  const claim=await gateways.claim(input,attempt,summary.paymentId,action.href);
  if(!claim)return {state:'already_claimed'};
  try{
    if(safeTryCaptureAction(claim.action).href!==action.href)throw Error('Capture action changed');
    const response=await gateways.settle(action,summary.paymentId);
    const checked=checkedProviderResult(response.httpStatus,response.data);
    // No response, decline or unexpected response permits another capture.
    const outcome=checked.outcome==='settlement_requested' ? 'settlement_requested':'uncertain';
    if(!await gateways.record(input.reference,claim,{
      outcome,actions:checked.actions,correlationId:response.correlationId,
    }))return {state:'uncertain'};
    return {state:outcome};
  }catch{return {state:'uncertain'};}
}
