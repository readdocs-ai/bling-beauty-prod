import assert from 'node:assert/strict';
import {readIssuerReturn} from './lib/worldpay/issuer-return.mjs';
const id='challenge_reference_123';
const request=body=>new Request('https://example.test/return',{method:'POST',body:new URLSearchParams(body)});
assert.equal((await readIssuerReturn(request({TransactionId:id}))).id,id);
assert.equal((await readIssuerReturn(request({TransactionId:id,Response:'x'.repeat(8000),MD:'session',providerExtra:'ignored'}))).id,id);
assert.equal((await readIssuerReturn(request({Response:'secret'}))).reason,'missing_transaction_id');
assert.equal((await readIssuerReturn(request({TransactionId:'<script>'}))).reason,'invalid_transaction_id');
assert.equal((await readIssuerReturn(request([['TransactionId',id],['TransactionId',id]]))).reason,'duplicate_transaction_id');
assert.equal((await readIssuerReturn(request({TransactionId:id,Response:'x'.repeat(40000)}))).status,413);
assert.equal((await readIssuerReturn(new Request('https://example.test',{method:'POST',body:'TransactionId='+id}))).status,415);
const diagnostic=(await readIssuerReturn(request({TransactionId:id,Response:'SECRET_RESPONSE',MD:'SECRET_MD',SECRET_KEY:'SECRET_VALUE'}))).diagnostic;
for(const value of [id,'SECRET_RESPONSE','SECRET_MD','SECRET_KEY','SECRET_VALUE'])assert.equal(JSON.stringify(diagnostic).includes(value),false);
const form=new FormData();form.set('TransactionId',id);form.set('Response','ignored');
assert.equal((await readIssuerReturn(new Request('https://example.test',{method:'POST',body:form}))).id,id);
// Enforce the actual stream length even if Content-Length is absent.
const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('TransactionId='+id+'&Response='+'x'.repeat(40000)));controller.close();}});
assert.equal((await readIssuerReturn(new Request('https://example.test',{method:'POST',body:stream,duplex:'half',headers:{'content-type':'application/x-www-form-urlencoded'}}))).status,413);
console.log('PASS: issuer callback accepts documented ID plus extra provider fields; bounds actual body size and never logs token contents');
