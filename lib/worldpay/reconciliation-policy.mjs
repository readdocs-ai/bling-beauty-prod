/** Pure, fail-closed Payment Queries v1 reconciliation. No HTTP/SQL. */
const REF = /^BLING-[0-9a-f-]{36}$/;
const ID = /^[A-Za-z0-9_-]{3,128}$/;
export function classifyPaymentQuery(body, expected) {
  if (!expected || !REF.test(expected.reference) || !Number.isSafeInteger(expected.amountPence) ||
      expected.amountPence < 1 || typeof expected.entity !== 'string' || !expected.entity) throw Error('Invalid expected order');
  const payments = body?._embedded?.payments;
  if (!Array.isArray(payments)) return {state:'uncertain',reason:'invalid_query'};
  if (!payments.length) return {state:'pending',reason:'not_indexed_yet'};
  // Any extra result is ambiguous: never ignore a duplicate or mismatched record.
  if (payments.length !== 1) return {state:'uncertain',reason:'ambiguous_payments'};
  const p=payments[0];
  if (!p || p.transactionReference !== expected.reference || p.entity !== expected.entity ||
      p.value?.currency !== 'GBP' || p.value?.amount !== expected.amountPence ||
      typeof p.paymentId !== 'string' || !ID.test(p.paymentId)) return {state:'uncertain',reason:'payment_mismatch'};
  const event=typeof p.lastEvent === 'string' ? p.lastEvent.toLowerCase() : '';
  if (['authorizationrefused','authorizationfailed','salerefused','salefailed','refused'].includes(event))
    return {state:'failed',reason:'provider_declined',paymentId:p.paymentId,event};
  if (['authorizationsucceeded','authorized','authorised','sal esucceeded'.replace(' ',''),
       'settlementrequested','settlementrequestsubmitted','sentforsettlement','settled',
       'capturesucceeded','salesucceeded'].includes(event))
    return {state:'pending',reason:'requires_verified_settlement',paymentId:p.paymentId,event};
  return {state:'uncertain',reason:'unrecognised_event',paymentId:p.paymentId,event};
}
export function canRecordSettledEvidence(result, detailedEvidence) {
  // Query summary does not prove settlement. A *separately established* authoritative
  // event must be verified against the same payment, reference, entity and amount.
  return result?.state === 'pending' && !!result.paymentId &&
    detailedEvidence?.paymentId === result.paymentId &&
    detailedEvidence?.settlementEvent === 'settled' && detailedEvidence?.independentlyVerified === true;
}
