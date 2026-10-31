import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const ts=createRequire(import.meta.url)('typescript'),savedEnv={...process.env};
const moduleURL=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
let inserts=[],afters=[],processed=[],inboxError=null,storedHash=null;
globalThis.__blingWpecomRoute={after:fn=>afters.push(fn),process:async e=>processed.push(e),db:{from:()=>({insert:async e=>{inserts.push(e);return {error:inboxError};},select:()=>({eq(){return this;},single:async()=>({data:{body_sha256:storedHash},error:null})})})}};
const stubs={'next/server':moduleURL('export const NextResponse={json:(b,o)=>Response.json(b,o)};export const after=globalThis.__blingWpecomRoute.after;'),'@/lib/supabase':moduleURL('export const supabaseAdmin=globalThis.__blingWpecomRoute.db;'),'@/lib/worldpay/settlement-worker':moduleURL('export const processSettlementEvent=globalThis.__blingWpecomRoute.process;')};
for(const name of ['webhook-policy.mjs','live-policy.mjs','settlement-events.mjs'])stubs['@/lib/worldpay/'+name]=pathToFileURL(process.cwd()+'/lib/worldpay/'+name).href;
const source=readFileSync('app/api/worldpay/events/route.ts','utf8').replace(/from\s+(['"])([^'"]+)\1/g,(m,q,s)=>stubs[s]?`from ${JSON.stringify(stubs[s])}`:m);
const {POST}=await import(moduleURL(source));
const body={eventId:'event_fixture_123',eventTimestamp:'2026-10-31T09:00:00Z',eventDetails:{classification:'payment',type:'sentForSettlement',transactionReference:'BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',amount:{value:13000,currencyCode:'GBP'},paymentId:'payment_fixture',merchant:{entity:'merchant_fixture'}}};
const request=(payload=body,headers={'x-vercel-forwarded-for':'34.246.73.11'})=>new Request('https://blingbeautyproducts.com/api/worldpay/events',{method:'POST',headers,body:typeof payload==='string'?payload:JSON.stringify(payload)});
try{
 Object.assign(process.env,{VERCEL:'1',VERCEL_ENV:'production',WORLDPAY_ENVIRONMENT:'live',WORLDPAY_ENTITY:'merchant_fixture',WORLDPAY_WEBHOOK_AUTH:'worldpay_ip',BLING_LIVE_SETTLEMENT_EVENTS:'true',BLING_WPECOM_FIREWALL_VERIFIED:'true'});delete process.env.WORLDPAY_EVENT_SIGNING_KEYS;
 assert.equal((await POST(request(body,{}))).status,403);assert.equal((await POST(request(body,{'x-forwarded-for':'34.246.73.11'}))).status,403);
 assert.equal((await POST(request('x'.repeat(65537)))).status,400);assert.equal((await POST(request({...body,eventDetails:{...body.eventDetails,merchant:{entity:'different'}}}))).status,400);
 assert.equal((await POST(request({...body,eventDetails:{...body.eventDetails,type:'authorized'}}))).status,200);assert.equal(inserts.length,0);
 assert.equal((await POST(request())).status,200);assert.equal(inserts.length,1);assert.equal(afters.length,1);assert.equal(processed.length,0);assert.match(inserts[0].body_sha256,/^[a-f0-9]{64}$/);await afters[0]();assert.equal(processed.length,1);
 inboxError={code:'23505'};storedHash=inserts[0].body_sha256;assert.equal((await POST(request())).status,200);storedHash='0'.repeat(64);assert.equal((await POST(request())).status,409);
 inboxError={code:'XX000'};assert.equal((await POST(request())).status,503);process.env.BLING_LIVE_SETTLEMENT_EVENTS='false';assert.equal((await POST(request())).status,404);
 console.log('PASS actual WPecom receiver: trust/config guards, bounded body, merchant match, durable acknowledgement, deferred work and duplicate/conflict handling. No external requests.');
}finally{delete globalThis.__blingWpecomRoute;for(const k of Object.keys(process.env))if(!(k in savedEnv))delete process.env[k];Object.assign(process.env,savedEnv);}
