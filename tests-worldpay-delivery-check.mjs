import assert from 'node:assert/strict';
import {tryDeliveryCheck} from './lib/worldpay/try-delivery-check.mjs';
const enabled={environment:'preview',worldpayEnvironment:'try',enabled:'true'};
const request=(body,headers={})=>new Request('https://example.invalid/api/worldpay/try-delivery-check?secret=never-log',{
 method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
for(const config of [{...enabled,environment:'production'},{...enabled,worldpayEnvironment:'live'},{...enabled,enabled:undefined}]){
 assert.equal((await tryDeliveryCheck(request({}),config)).status,404);
}
const records=[];
const settled=request({eventId:'private-reference',eventDetails:{type:'settled',customer:{email:'private@example.invalid'},
 paymentId:'private-payment',amount:{value:13000,currencyCode:'GBP'}}},{'event-signature':'private-signature'});
const response=await tryDeliveryCheck(settled,enabled,m=>records.push(m));
assert.equal(response.status,200);
assert.deepEqual(await response.json(),{received:true,verified:false,paymentProcessing:false});
assert.equal(records.length,1);
assert.deepEqual(Object.keys(records[0]).sort(),['mode','bytes','signaturePresent','eventType','verified'].sort());
assert.equal(records[0].signaturePresent,true);
assert.equal(records[0].verified,false);
assert.equal(records[0].eventType,'settled');
assert.ok(!JSON.stringify(records).includes('private'));
assert.ok(!JSON.stringify(records).includes('never-log'));
const unsigned=[];
await tryDeliveryCheck(request({eventDetails:{type:'attacker-controlled-log-text'}}),enabled,m=>unsigned.push(m));
assert.equal(unsigned[0].eventType,'other');assert.equal(unsigned[0].signaturePresent,false);
assert.equal((await tryDeliveryCheck(request({padding:'x'.repeat(65536)}),enabled)).status,413);
const streamed=new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json'},duplex:'half',
 body:new ReadableStream({start(c){c.enqueue(new Uint8Array(65537));c.close();}})});
assert.equal((await tryDeliveryCheck(streamed,enabled)).status,413);
assert.equal((await tryDeliveryCheck(new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json'},body:'invalid'}),enabled)).status,400);
assert.equal((await tryDeliveryCheck(request(null),enabled)).status,400);
assert.equal((await tryDeliveryCheck(request({}, {'content-type':'text/plain'}),enabled)).status,415);
console.log('Try-only delivery diagnostic: isolation, bounds and metadata privacy pass');
