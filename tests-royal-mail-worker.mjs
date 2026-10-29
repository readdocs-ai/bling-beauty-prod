import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const ts=createRequire(import.meta.url)('typescript'),savedEnv={...process.env};
const reference='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',orderId='aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaaaa';
let row,postCount=0,lookupCount=0,networkFails=false,existing=null,job={status:'pending'};
function reset(){row={id:orderId,reference,status:'paid',payment_environment:'live',provider_payment_id:'pay_fixture',provider_event_id:'event_fixture',verified_at:'2026-10-29',currency:'GBP',amount_pence:13000,created_at:'2026-10-29T01:00:00Z',customer:{name:'Synthetic Customer',email:'customer@example.invalid'},shipping:{address1:'Synthetic Test Address',city:'London',postcode:'SW1A 1AA',country:'GB'}};job={status:'pending'};postCount=0;lookupCount=0;networkFails=false;existing=null;}
const db={from(name){let updates,filters=[];const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},single:async()=>({data:filters.every(([k,v])=>row[k]===v)?structuredClone(row):null,error:null}),update(v){updates=v;return q;},then(ok,no){if(name==='bling_paid_order_jobs'&&filters.every(([k,v])=>k==='order_id'?v===orderId:k==='kind'?v==='royal_mail':job[k]===v))Object.assign(job,updates);return Promise.resolve({error:null}).then(ok,no);}};return q;},async rpc(name,p){
 if(name==='bling_claim_royal_mail_import'){if(row.royal_mail_claim_id||job.status!=='pending')return {data:false,error:null};Object.assign(row,{royal_mail_claim_id:p.p_claim,royal_mail_reference:p.p_reference});job.status='sending';return {data:true,error:null};}
 if(name==='bling_finish_royal_mail_import'){assert.equal(row.royal_mail_claim_id,p.p_claim);row.royal_mail_order_id=p.p_provider_id;job.status='completed';return {data:true,error:null};}
 throw Error(name);
}};
globalThis.__royalMailWorkerFixture={db,async prepare(p){return p;},configured:()=>true,async import(){postCount++;if(networkFails)throw Error('timeout');return {orderIdentifier:'12345',reference:'BLING-'+reference.slice(6).replaceAll('-',''),trackingNumber:null,shippedOn:null};},async find(){lookupCount++;return existing;}};
const moduleURL=code=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const stubDb=moduleURL('export const supabaseAdmin=globalThis.__royalMailWorkerFixture.db;'),stubApi=moduleURL('const f=globalThis.__royalMailWorkerFixture;export const importClickDropOrder=f.import,findClickDropOrder=f.find,clickDropConfigured=f.configured,prepareClickDropAccount=f.prepare;');
let source=readFileSync('lib/shipping/royal-mail-worker.ts','utf8').replace("import 'server-only';",'').replace("'@/lib/supabase'",JSON.stringify(stubDb)).replace("'@/lib/royal-mail-click-drop'",JSON.stringify(stubApi)).replace("'./click-drop-policy.mjs'",JSON.stringify(pathToFileURL(process.cwd()+'/lib/shipping/click-drop-policy.mjs').href));
const worker=await import(moduleURL(source));Object.assign(process.env,{VERCEL_ENV:'production',WORLDPAY_ENVIRONMENT:'live',BLING_ROYAL_MAIL_IMPORT_ENABLED:'true'});
const packing={weightGrams:500,taxPence:0,packageFormat:'smallParcel'};
try{
 reset();row.payment_environment='try';await assert.rejects(worker.importPaidOrderToRoyalMail(orderId,packing));assert.equal(postCount,0);
 reset();await assert.rejects(worker.importPaidOrderToRoyalMail(orderId,{...packing,weightGrams:0}));assert.equal(row.royal_mail_claim_id,undefined);
 await worker.importPaidOrderToRoyalMail(orderId,packing);assert.equal(postCount,1);assert.equal(job.status,'completed');
 await assert.rejects(worker.importPaidOrderToRoyalMail(orderId,packing));assert.equal(postCount,1);
 reset();networkFails=true;await assert.rejects(worker.importPaidOrderToRoyalMail(orderId,packing));assert.equal(job.status,'needs_review');assert.ok(row.royal_mail_claim_id);
 await assert.rejects(worker.importPaidOrderToRoyalMail(orderId,packing));assert.equal(postCount,1);
 assert.equal((await worker.reconcileRoyalMailImport(orderId)).found,false);assert.equal(postCount,1);
 existing={orderIdentifier:'12345',reference:row.royal_mail_reference,trackingNumber:'AA123456789GB',shippedOn:null};
 assert.equal((await worker.reconcileRoyalMailImport(orderId)).found,true);assert.equal(postCount,1);assert.equal(job.status,'completed');assert.equal(row.royal_mail_order_id,'12345');assert.equal(lookupCount,2);
 console.log('PASS actual shipping worker: only verified Live orders, validation before claim, durable single-use import, timeout review and read-only recovery without duplicate POSTs. Synthetic database/provider only.');
}finally{delete globalThis.__royalMailWorkerFixture;for(const k of Object.keys(process.env))if(!(k in savedEnv))delete process.env[k];Object.assign(process.env,savedEnv);}
