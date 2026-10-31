/** A matched authenticated Payment Queries response confirms capture submission,
 * not final settlement. No browser, callback or bank statement is payment proof. */
export function matchesApiCapture(attempt,query){
 return attempt?.payment_environment==='live'&&attempt.settlement_mode==='auto'&&attempt.status==='payment_processing'&&attempt.currency==='GBP'&&Number.isSafeInteger(attempt.amount_pence)&&attempt.amount_pence>0&&!!attempt.payment_claim_id&&query?.state==='pending'&&query.event==='settlementrequestsubmitted'&&typeof query.paymentId==='string'&&/^[A-Za-z0-9_-]{3,128}$/.test(query.paymentId)&&(attempt.provider_payment_id===null||attempt.provider_payment_id===query.paymentId);
}
export function hasPaymentEvidence(order){return !!order?.provider_event_id||(typeof order?.provider_verification_id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(order.provider_verification_id));}
