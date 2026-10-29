/** Exercises real Live route handlers/transport/persistence with an in-memory SQL/provider boundary.
 * No network requests, real orders or emails. Does not establish Worldpay Live approval.
 */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash,createHmac} from 'node:crypto';
const require=createRequire(import.meta.url),ts=require('typescript');
const savedEnv={...process.env},savedFetch=globalThis.fetch;
const rows=[],events=[],orders=[],jobs=[],deliveries=[],providerCalls=[],afterJobs=[];
let suspended=false,providerTimeout=false,queryMismatch=false;
const rowMatch=(row,filters)=>filters.every(([key,value])=>row[key]===value);
function table(name){return ({bling_checkout_attempts:rows,bling_worldpay_settlement_events:events,bling_paid_orders:orders,bling_paid_order_jobs:jobs,store_settings:[{id:1,orders_suspended:suspended}]})[name]??[];}
function from(name){
 let action='select',payload,filters=[],single=false,projection='*';
 const q={select(s='*'){projection=s;return q;},insert(value){action='insert';payload=value;return q;},update(value){action='update';payload=value;return q;},eq(k,v){filters.push([k,v]);return q;},in(){return q;},order(){return q;},limit(){return q;},maybeSingle(){single=true;return q;},single(){single=true;return q;},then(ok,no){
  try{
   const t=table(name);let found=t.filter(row=>rowMatch(row,filters));
   if(action==='insert'){
    if(name==='bling_worldpay_settlement_events'&&t.some(row=>row.environment===payload.environment&&row.event_id===payload.event_id))return Promise.resolve({data:null,error:{code:'23505'}}).then(ok,no);
    const row={id:`${String(t.length+1).padStart(8,'0')}-aaaa-4aaa-aaaa-aaaaaaaaaaaa`,created_at:new Date().toISOString(),provider_payment_id:null,...structuredClone(payload)};t.push(row);found=[row];
   }else if(action==='update')for(const row of found)Object.assign(row,structuredClone(payload));
   const data=found.map(row=>projection==='*'?structuredClone(row):Object.fromEntries(projection.split(',').map(k=>[k,row[k]])));
   return Promise.resolve({data:single?data[0]??null:data,error:null}).then(ok,no);
  }catch(e){return Promise.reject(e).then(ok,no);}
 }};return q;
}
async function rpc(name,p){
 const row=rows.find(r=>r.reference===p.p_reference);
 let data=false;
 if(name==='bling_claim_owned_payment'){
  if(row?.status==='pending'&&!row.payment_claim_id&&row.browser_secret_sha256===p.p_secret_sha256){Object.assign(row,{status:'payment_processing',payment_claim_id:p.p_claim});data=true;}
 }else if(name==='bling_store_provider_progress'){
  if(row?.payment_claim_id===p.p_claim){Object.assign(row,{provider_outcome:p.p_outcome,provider_actions:p.p_actions});data=true;}
 }else if(name==='bling_claim_provider_continuation'){
  if(row?.payment_claim_id===p.p_payment_claim&&row.browser_secret_sha256===p.p_secret_sha256&&!row.provider_continuation_claim&&row.provider_outcome===p.p_expected_stage&&(p.p_expected_stage!=='challenge'||row.issuer_challenge_return_seen)){
   row.provider_continuation_claim=p.p_continuation_claim;data={action:row.provider_actions[p.p_expected_stage==='device_data'?'supply3dsDeviceData':'complete3dsChallenge']};
  }
 }else if(name==='bling_store_continuation_progress'){
  if(row?.provider_continuation_claim===p.p_continuation_claim){Object.assign(row,{provider_outcome:p.p_outcome,provider_actions:p.p_actions,provider_continuation_claim:null});data=true;}
 }else if(name==='bling_register_issuer_challenge'){
  Object.assign(row,{issuer_challenge_reference:p.p_challenge_reference,issuer_challenge_return_seen:false});data=true;
 }else if(name==='bling_mark_issuer_challenge_return'){
  const a=rows.find(r=>r.issuer_challenge_reference===p.p_challenge_reference);if(a){a.issuer_challenge_return_seen=true;data=true;}
 }else if(name==='bling_commit_settled_event'){
  const e=events.find(e=>e.event_id===p.p_event_id&&e.environment===p.p_environment),a=rows.find(r=>r.reference===e?.reference);
  assert.equal(a.payment_environment,'live');assert.equal(a.payment_claim_id,p.p_claim);assert.equal(e.body_sha256,p.p_body_sha256);
  let order=orders.find(o=>o.reference===a.reference);
  if(!order){order={...a,id:'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaaaa',status:'paid',provider_payment_id:p.p_payment_id,provider_event_id:p.p_event_id,verified_at:new Date().toISOString()};orders.push(order);for(const kind of ['customer_email','admin_email'])jobs.push({order_id:order.id,kind,status:'pending'});}
  Object.assign(a,{status:'paid_verified',provider_payment_id:p.p_payment_id});Object.assign(e,{status:'processed',order_id:order.id});data=order.id;
 }else throw Error(`Unexpected RPC ${name}`);
 return {data,error:null};
}
globalThis.__blingLiveTest={supabaseAdmin:{from,rpc},afterJobs};
const cache=new Map();
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
function moduleUrl(file){
 file=resolve(file);if(cache.has(file))return cache.get(file);
 let source=readFileSync(file,'utf8').replace(/import ['"]server-only['"];?/g,'');
 source=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 source=source.replace(/from\s+(['"])([^'"]+)\1/g,(all,quote,spec)=>{
  let target;
  if(spec==='next/server')target=url("export const NextResponse={json:(body,init)=>Response.json(body,init)};export function after(fn){globalThis.__blingLiveTest.afterJobs.push(fn);}");
  else if(spec==='@/lib/supabase')target=url('export const supabaseAdmin=globalThis.__blingLiveTest.supabaseAdmin;');
  else if(spec.startsWith('@/')||spec.startsWith('.')){
   let path=spec.startsWith('@/')?resolve(spec.slice(2)):resolve(dirname(file),spec);
   if(!existsSync(path))path+='.ts';
   target=path.endsWith('.mjs')?pathToFileURL(path).href:moduleUrl(path);
  }else if(spec.startsWith('node:'))return all;
  else target=pathToFileURL(require.resolve(spec)).href;
  return `from ${JSON.stringify(target)}`;
 });
 const target=url(source);cache.set(file,target);return target;
}
const base='https://blingbeautyproducts.com',key='synthetic-signature-key';
Object.assign(process.env,{VERCEL_ENV:'production',WORLDPAY_ENVIRONMENT:'live',BLING_LIVE_CHECKOUT_ENABLED:'true',WORLDPAY_API_USERNAME:'synthetic',WORLDPAY_API_PASSWORD:'synthetic',WORLDPAY_ENTITY:'synthetic',WORLDPAY_STATEMENT_NARRATIVE:'Bling Beauty Products',WORLDPAY_CHECKOUT_ID:'syntheticcheckout',NEXT_PUBLIC_SITE_URL:base,BLING_LIVE_SETTLEMENT_EVENTS:'true',WORLDPAY_EVENT_SIGNING_KEYS:JSON.stringify({'1':key}),BLING_ORDER_EMAILS_ENABLED:'true',RESEND_API_KEY:'synthetic',CRON_SECRET:'synthetic'});
let currentReference;
globalThis.fetch=async(href,options={})=>{
 if(href==='https://api.resend.com/emails'){
  deliveries.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return Response.json({id:`synthetic_delivery_${deliveries.length}`});
 }
 assert.ok(href.startsWith('https://access.worldpay.com/'),'never call Try during Live');
 if(options.method==='POST'){
  providerCalls.push(href);if(providerTimeout)throw Error('synthetic timeout');
  if(href.endsWith('/api/payments')){const p=JSON.parse(options.body);currentReference=p.transactionReference;assert.equal(p.instruction.settlement.auto,true);assert.equal(p.instruction.value.amount,rows.find(r=>r.reference===p.transactionReference).amount_pence);return Response.json({outcome:'3dsDeviceDataRequired',deviceDataCollection:{jwt:'synthetic_jwt_123456',url:'https://issuer.example/ddc',bin:'444433'},_actions:{supply3dsDeviceData:{method:'POST',href:'https://access.worldpay.com/api/payments/opaque/3dsDeviceData'}}},{status:201});}
  if(href.endsWith('/3dsDeviceData'))return Response.json({outcome:'3dsChallenged',challenge:{reference:'synthetic_challenge_123',jwt:'synthetic_jwt_123456',url:'https://issuer.example/challenge'},_actions:{complete3dsChallenge:{method:'POST',href:'https://access.worldpay.com/api/payments/opaque/3dsChallenges'}}},{status:201});
  if(href.endsWith('/3dsChallenges')){assert.equal(options.body,undefined);return Response.json({outcome:'sentForSettlement'},{status:201});}
 }
 if(href.includes('/paymentQueries/payments?')){const a=rows.find(r=>r.reference===currentReference);return Response.json({_embedded:{payments:[{transactionReference:a.reference,entity:'synthetic',value:{amount:queryMismatch?1:a.amount_pence,currency:'GBP'},paymentId:'pay_synthetic_123',lastEvent:'settlementRequested'}]}});}
 throw Error(`Unexpected fetch ${href}`);
};
const load=path=>import(moduleUrl(path));
const request=(path,body,origin=base)=>new Request(base+path,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
try{
 const prepare=await load('app/api/worldpay/prepare/route.ts'),init=await load('app/api/worldpay/initiate/route.ts'),ddc=await load('app/api/worldpay/device-data/route.ts'),challenge=await load('app/api/worldpay/challenge-complete/route.ts'),callback=await load('app/api/worldpay/challenge-return/route.ts'),status=await load('app/api/worldpay/attempt-status/route.ts'),eventsRoute=await load('app/api/worldpay/events/route.ts');
 const {luxuryItems}=await load('lib/luxury-catalogue.ts');
 const body={items:[{slug:luxuryItems[0].slug,quantity:1}],customer:{name:'Synthetic Customer',email:'customer@example.invalid'},shipping:{address1:'Synthetic test address',city:'London',postcode:'SW1A 1AA',country:'GB'}};
 suspended=true;assert.equal((await prepare.POST(request('/api/checkout',body))).status,503);assert.equal(rows.length,0);suspended=false;
 assert.equal((await prepare.POST(request('/api/checkout',body,'https://attacker.example'))).status,503);
 const response=await prepare.POST(request('/api/checkout',body));assert.equal(response.status,200);const prepared=await response.json();
 assert.equal(rows.length,1);assert.equal(rows[0].payment_environment,'live');assert.equal(rows[0].settlement_mode,'auto');assert.equal(rows[0].browser_secret_sha256,createHash('sha256').update(prepared.ownershipSecret).digest('hex'));
 const browser={userAgent:'Synthetic Browser',language:'en-GB',width:1280,height:800,timeZone:0};
 const payment={reference:prepared.reference,ownershipSecret:prepared.ownershipSecret,browser,sessionHref:'https://access.worldpay.com/sessions/synthetic_session'};
 assert.equal((await init.POST(request('/api/worldpay/initiate',{...payment,sessionHref:'https://try.access.worldpay.com/sessions/synthetic_session'}))).status,400);assert.equal(providerCalls.length,0);
 assert.equal((await init.POST(request('/api/worldpay/initiate',{...payment,ownershipSecret:'b'.repeat(64)}))).status,409);
 assert.equal((await init.POST(request('/api/worldpay/initiate',payment))).status,202);
 assert.equal((await init.POST(request('/api/worldpay/initiate',payment))).status,409);assert.equal(providerCalls.length,1);
 const owned={reference:prepared.reference,ownershipSecret:prepared.ownershipSecret};
 assert.equal((await challenge.POST(request('/api/worldpay/challenge-complete',owned))).status,409);
 assert.equal((await ddc.POST(request('/api/worldpay/device-data',{...owned,collectionReference:'synthetic_ddc'}))).status,202);
 assert.equal((await challenge.POST(request('/api/worldpay/challenge-complete',owned))).status,409,'must see issuer callback first');
 const cb=new Request(base+'/api/worldpay/challenge-return',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'TransactionId=synthetic_challenge_123'});
 assert.equal((await callback.POST(cb)).status,200);
 assert.equal((await challenge.POST(request('/api/worldpay/challenge-complete',owned))).status,202);assert.equal(rows[0].provider_outcome,'settlement_requested');
 assert.equal(orders.length,0);assert.equal(deliveries.length,0,'no paid emails for submission alone');
 const event={eventId:'synthetic_event_123',eventTimestamp:'2026-10-29T04:00:00Z',eventDetails:{classification:'payment',type:'settled',transactionReference:prepared.reference,amount:{currencyCode:'GBP',value:rows[0].amount_pence}}};
 const raw=JSON.stringify(event),signature='1/SHA256/'+createHmac('sha256',key).update(raw).digest('hex');
 const notify=signature=>eventsRoute.POST(new Request(base+'/api/worldpay/events',{method:'POST',headers:{'content-type':'application/json',...(signature?{'event-signature':signature}:{})},body:raw}));
 assert.equal((await notify(null)).status,400);assert.equal(events.length,0);
 queryMismatch=true;assert.equal((await notify(signature)).status,200);while(afterJobs.length)await afterJobs.shift()();assert.equal(orders.length,0,'query amount mismatch blocks finalisation');
 queryMismatch=false;assert.equal((await notify(signature)).status,200);while(afterJobs.length)await afterJobs.shift()();
 assert.equal(orders.length,1);assert.equal(jobs.length,2);assert.equal(deliveries.length,2);
 assert.equal(deliveries[0].body.to[0],'customer@example.invalid');assert.equal(deliveries[1].body.to[0],'info@blingbeautyproducts.com');assert.ok(!deliveries[0].body.subject.startsWith('[TEST]'));assert.ok(deliveries[0].body.text.includes('Delivery address:'));assert.notEqual(deliveries[0].key,deliveries[1].key);
 assert.equal((await notify(signature)).status,200);while(afterJobs.length)await afterJobs.shift()();assert.equal(orders.length,1);assert.equal(deliveries.length,2,'duplicate signed notification must not duplicate orders/emails');
 assert.equal((await (await status.POST(request('/api/worldpay/attempt-status',owned))).json()).status,'paid_verified');
 // A timeout consumes a second attempt's claim. It never retries the provider POST.
 const second=await (await prepare.POST(request('/api/checkout',body))).json();providerTimeout=true;
 const secondPayment={...payment,reference:second.reference,ownershipSecret:second.ownershipSecret};
 assert.equal((await init.POST(request('/api/worldpay/initiate',secondPayment))).status,503);
 assert.equal((await init.POST(request('/api/worldpay/initiate',secondPayment))).status,409);assert.equal(providerCalls.length,4);
 console.log('PASS actual Live handlers: pricing, origin, ownership, one-shot charge, DDC, issuer callback, 3DS, signed settlement, independent amount match, paid order, two idempotent emails, polling and timeout lock. Synthetic boundaries only; no external payment or email sent.');
}finally{
 globalThis.fetch=savedFetch;delete globalThis.__blingLiveTest;
 for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv);
}
