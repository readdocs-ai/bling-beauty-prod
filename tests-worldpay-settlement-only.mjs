import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyVerifiedPayment } from './lib/worldpay/payment-state.mjs';
const sql = readFileSync(new URL('./supabase/worldpay-payment-lock-and-finalisation-v2.sql', import.meta.url),'utf8');
assert.match(sql, /p_event\s*<>\s*'settled'/);
assert.match(sql, /a\.provider_last_event\s*<>\s*'settled'/);
assert.doesNotMatch(sql, /NOT IN\s*\(\s*'settlement_requested'\s*,\s*'settled'\s*\)/);
const base = {expectedReference:'BLING-9bf44c2e-6cb8-45d5-bd19-9ad64b1c4e81',expectedAmount:1234,expectedEntity:'test-entity'};
const payment = {transactionReference:base.expectedReference,entity:base.expectedEntity,value:{currency:'GBP',amount:1234},paymentId:'p-id'};
for(const lastEvent of ['authorized','sentForSettlement','captureRequested','']){
 assert.equal(classifyVerifiedPayment({...base,payment:{...payment,lastEvent}}).state,'pending');
}
assert.equal(classifyVerifiedPayment({...base,payment:{...payment,lastEvent:'settlementSucceeded'}}).state,'paid');
console.log('PASS: 8 settlement-only safety checks (static SQL + provider-state classifier). Database not exercised.');
