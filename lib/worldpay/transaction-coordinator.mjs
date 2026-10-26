/** Pure transaction coordinator rules. Browser input is never payment evidence.
 * This module deliberately performs NO HTTP or SQL operations.
 */
import { classifyIntegrated3DS, THREE_DS_STEPS, mayContinue3DS } from './three-ds-flow.mjs';
const stages = Object.freeze({ PENDING:'pending', PROCESSING:'payment_processing', DEVICE:'device_data', CHALLENGE:'challenge', AUTHORISED:'authorised', SETTLEMENT:'settlement_requested', PAID:'paid_verified', FAILED:'failed', UNCERTAIN:'uncertain' });
export { stages as TRANSACTION_STAGES };
export function validateServerOrder(order) {
  if (!order || !/^BLING-[0-9a-f-]{36}$/i.test(order.reference) ||
      order.currency !== 'GBP' || !Number.isSafeInteger(order.amount_pence) ||
      order.amount_pence <= 0 || order.amount_pence > 1000000) throw new Error('Invalid server-stored order');
  return { reference:order.reference, currency:'GBP', amount:order.amount_pence };
}
export function claimRequired(order) {
  validateServerOrder(order);
  if (order.status !== stages.PENDING || order.payment_claim_id != null) throw new Error('Already claimed or not pending');
  return true;
}
export function classifyProviderResponse(response, stage) {
  const result=classifyIntegrated3DS(response?.data, response?.status);
  if (stage === stages.PROCESSING && result.step === THREE_DS_STEPS.DEVICE_DATA)
    return {stage:stages.DEVICE, next:result.next, deviceDataCollection:result.deviceDataCollection};
  if ([stages.PROCESSING, stages.DEVICE].includes(stage) && result.step === THREE_DS_STEPS.CHALLENGE)
    return {stage:stages.CHALLENGE, next:result.next, challenge:result.challenge};
  if ([stages.PROCESSING, stages.DEVICE, stages.CHALLENGE].includes(stage) && result.step === THREE_DS_STEPS.AUTHORISED)
    return {stage:stages.AUTHORISED};
  if ([stages.PROCESSING, stages.DEVICE, stages.CHALLENGE, stages.AUTHORISED].includes(stage) && result.step === THREE_DS_STEPS.SETTLEMENT_REQUESTED)
    return {stage:stages.SETTLEMENT};
  if (result.step===THREE_DS_STEPS.DECLINED) return {stage:stages.FAILED};
  return {stage:stages.UNCERTAIN};
}
export function permittedContinuation(stage, action) {
  if (stage===stages.DEVICE) return mayContinue3DS(THREE_DS_STEPS.DEVICE_DATA,action);
  if (stage===stages.CHALLENGE) return mayContinue3DS(THREE_DS_STEPS.CHALLENGE,action);
  return false;
}
export function canFinalisePaid({stage, providerQuery, expectedReference, expectedAmount, expectedCurrency='GBP'}) {
  if (stage !== stages.SETTLEMENT || !providerQuery || typeof providerQuery !== 'object') return false;
  return providerQuery.transactionReference===expectedReference &&
     providerQuery.amount===expectedAmount && providerQuery.currency===expectedCurrency &&
     providerQuery.lastEvent === 'settled';
}
