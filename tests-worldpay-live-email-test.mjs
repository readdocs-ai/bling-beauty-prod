import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const savedEnv={...process.env};
let authorised=true,sends=[];
globalThis.__blingEmailSmoke={cookies:async()=>({get:()=>({value:'synthetic-session'})}),verify:async()=>authorised,send:async(...args)=>{sends.push(args);return {id:'synthetic-test-id'};}};
const moduleURL=code=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const stubs={
 'next/server':moduleURL('export const NextResponse={json:(body,options)=>Response.json(body,options)};'),
 '@/lib/email/send':moduleURL('export const sendOrderEmail=globalThis.__blingEmailSmoke.send;'),
 'next/headers':moduleURL('export const cookies=globalThis.__blingEmailSmoke.cookies;'),
 '@/lib/admin-session':moduleURL('export const verifyAdminSession=globalThis.__blingEmailSmoke.verify;'),
};
const source=readFileSync('app/admin/api/email-test/route.ts','utf8').replace(/from\s+(['"])([^'"]+)\1/g,(match,quote,spec)=>stubs[spec]?`from ${JSON.stringify(stubs[spec])}`:match);
const {POST}=await import(moduleURL(source));
const request=(origin='https://blingbeautyproducts.com')=>new Request('https://blingbeautyproducts.com/admin/api/email-test',{method:'POST',headers:{origin}});
try{
 Object.assign(process.env,{VERCEL_ENV:'production',WORLDPAY_ENVIRONMENT:'live'});
 authorised=false;assert.equal((await POST(request())).status,401);assert.equal(sends.length,0);authorised=true;
 assert.equal((await POST(request('https://other.example'))).status,403);assert.equal(sends.length,0);
 process.env.WORLDPAY_ENVIRONMENT='try';assert.equal((await POST(request())).status,403);assert.equal(sends.length,0);
 process.env.WORLDPAY_ENVIRONMENT='live';assert.equal((await POST(request())).status,200);assert.equal(sends.length,1);
 assert.equal(sends[0][0],'transport-test');assert.equal(sends[0][1].customerEmail,'info@blingbeautyproducts.com');assert.equal(sends[0][2].environment,'live');assert.match(sends[0][2].idempotencyKey,/^bling\/live\/email-smoke\/[0-9]+$/);
 assert.equal((await POST(request())).status,200);assert.deepEqual(sends[1],sends[0]);
 Object.assign(process.env,{VERCEL_ENV:'preview',WORLDPAY_ENVIRONMENT:'try'});assert.equal((await POST(request())).status,200);assert.notEqual(sends[2][2].idempotencyKey,sends[0][2].idempotencyKey);
 assert.ok(!source.includes('supabase'));assert.ok(!source.includes('createIntegratedPayment'));
 console.log('PASS actual email-test route: admin auth, origin, explicit runtime, fixed recipient/kind, stable hourly idempotency and separate Try/Live keys. No real email sent.');
}finally{delete globalThis.__blingEmailSmoke;for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv);}
