import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const ts=createRequire(import.meta.url)('typescript'),savedEnv={...process.env};const moduleURL=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const reference='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const event={environment:'live',event_id:'event_fixture',body_sha256:'a'.repeat(64),reference,amount_pence:13000,event_type:'sentForSettlement',authentication_method:'worldpay_ip',provider_payment_id:'payment_fixture',merchant_entity:'merchant_fixture',source_ip:'34.246.73.11'};
let attempt={reference,payment_environment:'live',currency:'GBP',amount_pence:13000,payment_claim_id:'claim_fixture',provider_payment_id:null,status:'payment_processing',settlement_mode:'auto'},query={state:'pending',paymentId:'payment_fixture',event:'settlementrequestsubmitted'},rpc=[],emails=[],queries=0,reserve=true,filters=[];
const db={from:table=>{let update=false;return {select(){return this;},eq(){return this;},limit(){return this;},update(){update=true;return this;},or(s){filters.push(s);return this;},then(resolve){resolve({error:null});},async maybeSingle(){return {data:table==='bling_checkout_attempts'?attempt:update?(reserve?{event_id:event.event_id}:null):event,error:null};}};},rpc:async(name,args)=>{rpc.push({name,args});return {data:'order_fixture',error:null};}};
globalThis.__blingWpecomWorker={db,query:async()=>{queries++;return query;},email:async id=>emails.push(id)};
const stubs={'@/lib/supabase':moduleURL('export const supabaseAdmin=globalThis.__blingWpecomWorker.db;'),'@/lib/worldpay-payment-query':moduleURL('export const verifyWorldpayPayment=globalThis.__blingWpecomWorker.query;'),'@/lib/paid-order-finalisation':moduleURL('export const processPaidOrderEmails=globalThis.__blingWpecomWorker.email;')};
for(const name of ['webhook-policy.mjs','settlement-events.mjs'])stubs['./'+name]=pathToFileURL(process.cwd()+'/lib/worldpay/'+name).href;
const source=readFileSync('lib/worldpay/settlement-worker.ts','utf8').replace("import 'server-only';",'').replace(/from\s+(['"])([^'"]+)\1/g,(m,q,s)=>stubs[s]?`from ${JSON.stringify(stubs[s])}`:m);
const {processSettlementEvent,recoverOwnedPayment}=await import(moduleURL(source));
try{
 Object.assign(process.env,{WORLDPAY_ENVIRONMENT:'live',WORLDPAY_ENTITY:'merchant_fixture'});
 assert.equal(await processSettlementEvent({...event,environment:'try'}),'environment_mismatch');assert.equal(queries,0);
 for(const ev of ['authorizationsucceeded','settlementrequested']){query={...query,event:ev};assert.equal(await processSettlementEvent(event),'awaiting_verification');assert.equal(rpc.length,0);assert.equal(emails.length,0);}
 query={...query,event:'settlementrequestsubmitted',paymentId:'wrong_fixture'};assert.equal(await processSettlementEvent(event),'awaiting_verification');assert.equal(rpc.length,0);
 query={...query,paymentId:'payment_fixture'};assert.equal(await processSettlementEvent(event),'processed');assert.equal(rpc[0].name,'bling_commit_wpecom_event');assert.equal(rpc[0].args.p_query_event,'settlementrequestsubmitted');assert.deepEqual(emails,['order_fixture']);
 const before=queries;reserve=false;await recoverOwnedPayment(reference);assert.equal(queries,before);assert.match(filters[0],/^last_checked_at.is.null,last_checked_at.lt./);reserve=true;await recoverOwnedPayment(reference);assert.equal(queries,before+1);
 console.log('PASS actual WPecom worker: independent query, authorization rejection, payment ID match, distinct capture RPC, post-commit emails and throttled owner recovery. No provider calls.');
}finally{delete globalThis.__blingWpecomWorker;for(const k of Object.keys(process.env))if(!(k in savedEnv))delete process.env[k];Object.assign(process.env,savedEnv);}
