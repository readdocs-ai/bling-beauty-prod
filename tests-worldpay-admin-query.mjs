import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
import {providerDiagnostic} from './lib/worldpay/integrated-payments-contract.mjs';
const ts=createRequire(import.meta.url)('typescript'),savedEnv={...process.env};
const moduleURL=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
let authorised=true,queries=0,lookups=0,failQuery=false;
const reference='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
globalThis.__blingAdminQuery={verify:async()=>authorised,cookies:async()=>({get:()=>({value:'synthetic'})}),db:{from:()=>{lookups++;return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{reference,amount_pence:13000,status:'payment_processing',provider_outcome:'uncertain'},error:null})};}},query:async(ref,amount)=>{queries++;assert.equal(ref,reference);assert.equal(amount,13000);if(failQuery)throw Error('Worldpay query unavailable (403)');return {state:'pending',reason:'not_indexed_yet'};}};
const stubs={'next/server':moduleURL('export const NextResponse={json:(b,o)=>Response.json(b,o)};'),'next/headers':moduleURL('export const cookies=globalThis.__blingAdminQuery.cookies;'),'@/lib/admin-session':moduleURL('export const verifyAdminSession=globalThis.__blingAdminQuery.verify;'),'@/lib/supabase':moduleURL('export const supabaseAdmin=globalThis.__blingAdminQuery.db;'),'@/lib/worldpay-payment-query':moduleURL('export const verifyWorldpayPayment=globalThis.__blingAdminQuery.query;'),'zod':new URL('node_modules/zod/index.js',import.meta.url).href};
const source=readFileSync('app/admin/api/worldpay-payment-check/route.ts','utf8').replace(/from\s+(['"])([^'"]+)\1/g,(m,q,s)=>stubs[s]?`from ${JSON.stringify(stubs[s])}`:m);
const {POST}=await import(moduleURL(source));
const request=(body={reference},origin='https://blingbeautyproducts.com')=>new Request('https://blingbeautyproducts.com/admin/api/worldpay-payment-check',{method:'POST',headers:{origin},body:JSON.stringify(body)});
try{
 Object.assign(process.env,{VERCEL_ENV:'production',WORLDPAY_ENVIRONMENT:'live'});
 authorised=false;assert.equal((await POST(request())).status,401);assert.equal(lookups,0);authorised=true;
 assert.equal((await POST(request({reference},'https://other.example'))).status,403);assert.equal(lookups,0);
 assert.equal((await POST(request({reference,amount:1}))).status,400);assert.equal((await POST(request({reference:'other'}))).status,400);
 process.env.WORLDPAY_ENVIRONMENT='try';assert.equal((await POST(request())).status,403);process.env.WORLDPAY_ENVIRONMENT='live';
 const ok=await POST(request());assert.equal(ok.status,200);assert.equal((await ok.json()).reason,'not_indexed_yet');assert.equal(queries,1);
 failQuery=true;const fail=await POST(request());assert.equal(fail.status,503);assert.match((await fail.json()).error,/HTTP 403/);
 assert.deepEqual(providerDiagnostic(400,{outcome:'3dsAuthenticationFailed',errorName:'fieldHasInvalidValue',message:'must not be logged',cardNumber:'synthetic-secret'},'fcd56a98-fadb-40af-a620-a6fa2e397441'),{httpStatus:400,outcome:'3dsAuthenticationFailed',errorName:'fieldHasInvalidValue',correlationId:'fcd56a98-fadb-40af-a620-a6fa2e397441'});
 assert.equal(providerDiagnostic(400,{outcome:'private@example.com',errorName:'1234567890123456'},'not-a-correlation-id').errorName,null);
 console.log('PASS actual admin payment-query route: authentication, origin, environment, strict reference, server amount, read-only query and redacted diagnostics. No payment or DB mutations.');
}finally{delete globalThis.__blingAdminQuery;for(const k of Object.keys(process.env))if(!(k in savedEnv))delete process.env[k];Object.assign(process.env,savedEnv);}
