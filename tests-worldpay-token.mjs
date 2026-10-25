import assert from 'node:assert/strict';
import {oneTimeVerifiedTokenPayload as payload} from './lib/worldpay/verified-token-payload.mjs';
const good='https://try.access.worldpay.com/verifiedTokens/sessions/abcdefghijklmnop123';
const p=payload({cardSessionHref:good,holderName:' Test Customer ',merchantEntity:'merchant123'});
assert.equal(p.paymentInstrument.sessionHref,good);
assert.equal(p.paymentInstrument.cardHolderName,'Test Customer');
assert.equal(p.merchant.entity,'merchant123');
assert.equal(p.verificationCurrency,'GBP');
assert.equal(JSON.stringify(p).includes('cardNumber'),false);
for (const bad of ['https://evil.example/verifiedTokens/sessions/abcdefghijklmnop123', 'https://try.access.worldpay.com@evil.example/verifiedTokens/sessions/abcdefghijklmnop123', 'https://try.access.worldpay.com/verifiedTokens/oneTime', 'https://try.access.worldpay.com/verifiedTokens/sessions/abcdefghijklmnop123?x=1', 'https://try.access.worldpay.com/verifiedTokens/sessions/../../api/payments']) {
  assert.throws(()=>payload({cardSessionHref:bad,holderName:'Test Customer',merchantEntity:'merchant123'}));
}
assert.throws(()=>payload({cardSessionHref:good,holderName:'X',merchantEntity:'merchant123'}));
assert.throws(()=>payload({cardSessionHref:good,holderName:'Test Customer',merchantEntity:'merchant 123'}));
console.log('Verified-token payload tests passed (12 checks).');
