import assert from 'node:assert/strict';
import {captureOwnedAttempt,matchesCaptureDetails} from './lib/worldpay/capture-coordinator.mjs';
const reference='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',paymentId='pay_test_123',secret='a'.repeat(64);
const input={reference,ownershipSecret:secret};
const action='https://try.access.worldpay.com/api/payments/opaque/settlements';
import {safeTryCaptureAction} from './lib/worldpay/capture-action.mjs';
assert.equal(safeTryCaptureAction('/payments/settlements/full/provider-token').kind,'card-v7');
for(const bad of ['https://evil.example/payments/settlements/full/x','https://access.worldpay.com/payments/settlements/full/x','/payments/settlements/partials/x','/payments/settlements/full/x?token=y'])assert.throws(()=>safeTryCaptureAction(bad));
const detail={paymentId,transactionReference:reference,entity:'default',value:{amount:13000,currency:'GBP'},lastEvent:'authorizationSucceeded',events:[{eventName:'authorizationRequested'},{eventName:'authorizationSucceeded'}]};
function fixture(overrides={}){
  const calls={settle:0,claim:0,record:0};let locked=false;
  const deps={entity:'default',
    readOwned:async()=>({status:'payment_processing',provider_outcome:'authorised',provider_continuation_claim:null,currency:'GBP',amount_pence:13000,payment_claim_id:'11111111-1111-4111-8111-111111111111',provider_actions:{settlePayment:action}}),
    verify:async()=>({state:'pending',event:'authorizationsucceeded',paymentId}),details:async()=>detail,
    claim:async()=>{calls.claim++;if(locked)return null;locked=true;return {action,captureClaim:'capture-claim',paymentClaim:'payment-claim'};},
    settle:async()=>{calls.settle++;return {httpStatus:202,data:{outcome:'sentForSettlement'},correlationId:null};},
    record:async()=>{calls.record++;return true;},...overrides,
  };
  return {deps,calls};
}
let f=fixture();assert.equal((await captureOwnedAttempt(input,f.deps)).state,'settlement_requested');
assert.equal((await captureOwnedAttempt(input,f.deps)).state,'already_claimed');assert.equal(f.calls.settle,1);
for(const overrides of [{verify:async()=>({state:'uncertain'})},{details:async()=>({...detail,value:{amount:1,currency:'GBP'}})},
  {details:async()=>({...detail,entity:'other'})},{details:async()=>({...detail,events:[...detail.events,{eventName:'settlementRequested'}]})},
  {readOwned:async()=>null}]){
  f=fixture(overrides);await captureOwnedAttempt(input,f.deps);assert.equal(f.calls.settle,0);assert.equal(f.calls.claim,0);
}
let sent=0;f=fixture({settle:async()=>{sent++;throw Error('timeout');}});
assert.equal((await captureOwnedAttempt(input,f.deps)).state,'uncertain');
assert.equal((await captureOwnedAttempt(input,f.deps)).state,'already_claimed');assert.equal(sent,1);
f=fixture({record:async()=>false});assert.equal((await captureOwnedAttempt(input,f.deps)).state,'uncertain');
assert.equal((await captureOwnedAttempt(input,f.deps)).state,'already_claimed');assert.equal(f.calls.settle,1);
let recorded;
f=fixture({settle:async()=>({httpStatus:500,data:{outcome:'sentForSettlement'}}),record:async(_r,_c,progress)=>{recorded=progress;return true;}});
assert.equal((await captureOwnedAttempt(input,f.deps)).state,'uncertain');assert.equal(recorded.outcome,'uncertain');
assert.equal(matchesCaptureDetails({...detail,events:[{eventName:'unknown'}]}, {reference,paymentId,entity:'default',amountPence:13000}),false);
const original=fixture();
const automatic=fixture({readOwned:async()=>({...await original.deps.readOwned(),settlement_mode:'auto'})});
assert.equal((await captureOwnedAttempt(input,automatic.deps)).state,'unavailable');
assert.equal(automatic.calls.claim,0);assert.equal(automatic.calls.settle,0);
f=fixture({readOwned:async()=>({...await original.deps.readOwned(),provider_actions:{}}),details:async()=>({...detail,_links:{'cardPayments:settle':{href:'/payments/settlements/full/provider-token'}}}),
  claim:async(_input,_attempt,_paymentId,href)=>({action:href,captureClaim:'claim',paymentClaim:'payment-claim'})});
assert.equal((await captureOwnedAttempt(input,f.deps)).state,'settlement_requested');assert.equal(f.calls.settle,1);
console.log('PASS: independent amount/entity/history checks precede single capture; repeated calls and ambiguous requests never recapture or mark paid');
