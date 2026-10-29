import assert from 'node:assert/strict';
import {liveReadiness,liveReturnUrl,assertLiveRuntime} from './lib/worldpay/live-policy.mjs';
import {safeIntegratedAction,checkedProviderResult} from './lib/worldpay/integrated-payments-contract.mjs';
import {buildIntegratedPaymentPayload} from './lib/worldpay/preview-payment-payload.mjs';
import {readBrowserAttempt,saveBrowserAttempt,markBrowserAttemptSubmitted} from './lib/worldpay/browser-attempt.mjs';
const env={VERCEL_ENV:'production',WORLDPAY_ENVIRONMENT:'live',BLING_LIVE_CHECKOUT_ENABLED:'true',
 WORLDPAY_API_USERNAME:'synthetic',WORLDPAY_API_PASSWORD:'synthetic',WORLDPAY_ENTITY:'synthetic',WORLDPAY_STATEMENT_NARRATIVE:'Bling Beauty Products',
 WORLDPAY_CHECKOUT_ID:'syntheticcheckout',NEXT_PUBLIC_SITE_URL:'https://blingbeautyproducts.com',
 BLING_LIVE_SETTLEMENT_EVENTS:'true',WORLDPAY_EVENT_SIGNING_KEYS:JSON.stringify({'1':'synthetic-signing-key'}),
 BLING_ORDER_EMAILS_ENABLED:'true',RESEND_API_KEY:'synthetic',CRON_SECRET:'synthetic'};
assert.equal(liveReadiness(env).ready,true);
for(const key of Object.keys(env))assert.equal(liveReadiness({...env,[key]:''}).ready,false,key);
for(const patch of [{VERCEL_ENV:'preview'},{WORLDPAY_ENVIRONMENT:'try'},{NEXT_PUBLIC_SITE_URL:'https://attacker.example'},
 {WORLDPAY_EVENT_SIGNING_KEYS:'[]'},{WORLDPAY_EVENT_SIGNING_KEYS:'{"bad":"key"}'},{WORLDPAY_EVENT_SIGNING_KEYS:'{"1":3}'}])assert.equal(liveReadiness({...env,...patch}).ready,false);
assert.equal(liveReturnUrl('https://www.blingbeautyproducts.com/api/worldpay/initiate',env),'https://www.blingbeautyproducts.com/api/worldpay/challenge-return');
assert.throws(()=>liveReturnUrl('https://evil.example/api/worldpay/initiate',env));
assert.throws(()=>assertLiveRuntime({...env,VERCEL_ENV:'preview'}));
assert.equal(safeIntegratedAction('https://access.worldpay.com/api/payments/opaque/3dsChallenges','challenge','live'),'https://access.worldpay.com/api/payments/opaque/3dsChallenges');
for(const href of ['https://try.access.worldpay.com/api/payments/x','https://access.worldpay.com.evil.example/api/payments/x','https://access.worldpay.com/api/payments/x?secret=1'])assert.throws(()=>safeIntegratedAction(href,'any','live'));
const reference='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const order={reference,status:'payment_processing',currency:'GBP',amount_pence:13000,settlement_mode:'auto'};
const browser={returnUrl:'https://blingbeautyproducts.com/api/worldpay/challenge-return',userAgent:'Synthetic browser',language:'en-GB',width:1280,height:800,timeZone:0};
const payload=buildIntegratedPaymentPayload(order,'https://access.worldpay.com/sessions/test_session','synthetic','Bling Beauty Products',browser,'live');
assert.equal(payload.instruction.value.amount,13000);assert.equal(payload.instruction.settlement.auto,true);
assert.throws(()=>buildIntegratedPaymentPayload(order,'https://try.access.worldpay.com/sessions/test_session','synthetic','Bling Beauty Products',browser,'live'));
assert.throws(()=>buildIntegratedPaymentPayload(order,'https://access.worldpay.com/sessions/test_session','synthetic','Bling Beauty Products',{...browser,returnUrl:'https://evil.example/api/worldpay/challenge-return'},'live'));
const reply={outcome:'3dsDeviceDataRequired',_actions:{supply3dsDeviceData:{method:'POST',href:'https://access.worldpay.com/api/payments/opaque/3dsDeviceData'}}};
assert.equal(checkedProviderResult(201,reply,'live').outcome,'device_data');assert.equal(checkedProviderResult(201,reply,'try').outcome,'uncertain');
const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
const attempt={version:1,reference,ownershipSecret:'a'.repeat(64),checkoutId:'syntheticcheckout',submitted:false};
saveBrowserAttempt(storage,attempt,'try');assert.equal(readBrowserAttempt(storage,'live'),null);
saveBrowserAttempt(storage,{...attempt,reference:'BLING-bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'},'live');
markBrowserAttemptSubmitted(storage,reference,'try');assert.equal(readBrowserAttempt(storage,'live').submitted,false);
console.log('PASS Live readiness, exact domains, cross-environment isolation, auto settlement and separate browser recovery. Synthetic fixtures only.');
