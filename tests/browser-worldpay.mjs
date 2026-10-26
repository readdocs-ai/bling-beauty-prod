/** Local browser regression suite with a simulated issuer/SDK/API.
 * No real Worldpay, Supabase, email or card requests are permitted by this suite.
 * Run against a locally built application: BLING_TEST_URL=http://127.0.0.1:3100 node tests/browser-worldpay.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const base=process.env.BLING_TEST_URL;
if(!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw Error('A local BLING_TEST_URL is required');
const reference='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const ownershipSecret='a'.repeat(64);
const jwt='abcdefghijklmnopqrstuvwxyz.0123456789.signature';
const challengeReference='challenge_reference_123';
const cardinal='https://centinelapistag.cardinalcommerce.com';
const browser=await chromium.launch({headless:true,...(process.env.BLING_CHROMIUM_EXECUTABLE ? {executablePath:process.env.BLING_CHROMIUM_EXECUTABLE,args:["--no-sandbox","--disable-dev-shm-usage"]} : {})});
let scenarios=0;
async function scenario(mode){
 const context=await browser.newContext();
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const calls={prepare:0,initiate:0,device:0,complete:0,challenge:0};
 await context.addInitScript(()=>{
  if(!localStorage.getItem('blingbeauty_cart_v2')) localStorage.setItem('blingbeauty_cart_v2',JSON.stringify({items:[{id:'luxury-test',slug:'radiance-collection',name:'Radiance Collection',price_gbp:130,qty:1}]}));
 });
 await context.route('**/*',async route=>{
  const request=route.request(),url=request.url(),path=new URL(url).pathname;
  const json=body=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  if(url==='https://try.access.worldpay.com/access-checkout/v2/checkout.js') return route.fulfill({contentType:'application/javascript',body:`window.Worldpay={checkout:{init(config,callback){callback(null,{remove(){},generateSessionState(cb){cb(null,'https://try.access.worldpay.com/sessions/mock-session')}})}}};`});
  if(url===cardinal+'/V1/Cruise/Collect'){
   assert.equal(request.method(),'POST');
   const form=new URLSearchParams(request.postData());
   assert.equal(form.get('JWT'),jwt);assert.equal(form.get('Bin'),'400000');
   return route.fulfill({contentType:'text/html',body:`<script>const msg={MessageType:'profile.completed',Status:true,SessionId:'mock_collection_123'};parent.postMessage(JSON.stringify(msg),'${base}');parent.postMessage(JSON.stringify(msg),'${base}');</script>`});
  }
  if(url===cardinal+'/V2/Cruise/StepUp'){
   calls.challenge++;assert.equal(request.method(),'POST');
   assert.equal(new URLSearchParams(request.postData()).get('JWT'),jwt);
   return route.fulfill({contentType:'text/html',body:`<form method="POST" action="${base}/api/worldpay/preview-challenge-return"><input name="TransactionId" value="${challengeReference}"><button>Complete simulated bank check</button></form>`});
  }
  if(url.startsWith(base+'/api/worldpay/')){
   if(path.endsWith('preview-prepare')){calls.prepare++;return json({reference,ownershipSecret,checkoutId:'mock_checkout_id',status:'pending'});}
   if(path.endsWith('preview-initiate')){
    calls.initiate++;assert.equal(request.postDataJSON().ownershipSecret,ownershipSecret);
    if(mode==='initiate-network-error') return route.abort('failed');
    return json({providerStage:'device_data',deviceData:{jwt,bin:'400000',url:cardinal+'/V1/Cruise/Collect'}});
   }
   if(path.endsWith('preview-device-data')){
    calls.device++;assert.equal(request.postDataJSON().collectionReference,'mock_collection_123');
    if(mode==='device-network-error') return route.abort('failed');
    return json({providerStage:'challenge',challenge:{jwt,url:cardinal+'/V2/Cruise/StepUp',reference:challengeReference}});
   }
   if(path.endsWith('preview-challenge-return')){
    assert.equal(new URLSearchParams(request.postData()).get('TransactionId'),challengeReference);
    return route.fulfill({contentType:'text/html',body:`<button id="wrong">Send mismatched return</button><button id="right">Send matching return twice</button><script>document.querySelector('#wrong').onclick=()=>parent.postMessage({type:'bling-worldpay-issuer-return',challengeReference:'wrong_reference'},location.origin);document.querySelector('#right').onclick=()=>{for(let i=0;i<2;i++)parent.postMessage({type:'bling-worldpay-issuer-return',challengeReference:'${challengeReference}'},location.origin)};</script>`});
   }
   if(path.endsWith('preview-challenge-complete')){
    calls.complete++;
    if(mode==='challenge-network-error') return route.abort('failed');
    return json({providerStage:'authorised',status:'payment_processing'});
   }
   if(path.endsWith('preview-attempt-status')) return json({status:'payment_processing',providerStage:'challenge'});
   if(path.endsWith('preview-reconcile')) return json({status:'payment_processing',providerState:'pending',reason:'not_indexed_yet'});
   throw Error('Unexpected Worldpay route');
  }
  if(!url.startsWith(base+'/') && !url.startsWith('data:')) return route.abort();
  return route.continue();
 });
 await page.goto(base+'/cart');
 for(const [placeholder,value] of [['Full name','Test Customer'],['Email address','test@example.invalid'],['Address line 1','10 Test Street'],['Town or city','London'],['UK postcode','E12 6PU']])
  await page.getByPlaceholder(placeholder,{exact:true}).fill(value);
 await page.getByRole('button',{name:'Prepare Preview secure card fields',exact:true}).click();
 const pay=page.getByRole('button',{name:'Submit Worldpay Try test payment',exact:true});
 await pay.waitFor();
 await pay.click();
 if(mode==='initiate-network-error') await page.getByText("Unable to confirm Worldpay's response. Do not retry this payment.",{exact:true}).waitFor();
 else if(mode==='device-network-error') await page.getByText('Authentication status is unresolved. Do not retry payment.',{exact:true}).waitFor();
 else {
  const open=page.getByRole('button',{name:'Open bank verification',exact:true});await open.waitFor();
  // A message from the parent window cannot substitute for an issuer-frame callback.
  await page.evaluate(ref=>window.postMessage({type:'bling-worldpay-issuer-return',challengeReference:ref},location.origin),challengeReference);
  assert.equal(calls.complete,0);
  await open.click();
  const issuer=page.frameLocator('iframe[name="bling-issuer-challenge-frame"]');
  await issuer.getByRole('button',{name:'Complete simulated bank check'}).click();
  await issuer.getByRole('button',{name:'Send mismatched return'}).click();
  assert.equal(calls.complete,0);
  await issuer.getByRole('button',{name:'Send matching return twice'}).click();
  await page.getByText(mode==='challenge-network-error'?'Bank verification unresolved. Do not retry payment.':'Bank authentication submitted for verification. Payment is not confirmed.',{exact:true}).waitFor();
  assert.equal(calls.challenge,1);assert.equal(calls.complete,1);assert.equal(calls.device,1);
 }
 assert.equal(calls.initiate,1);
 assert.equal(await page.getByRole('button',{name:'Test payment submitted — check status',exact:true}).isDisabled(),true);
 await page.reload();
 await page.getByText('Previous payment attempt restored. Check its status before continuing.',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Test payment submitted — check status',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Check Preview attempt status',exact:true}).click();
 await page.getByText('Order: payment_processing. Worldpay: challenge.',{exact:true}).waitFor();
 assert.equal(calls.prepare,1);assert.equal(calls.initiate,1);
 assert.deepEqual(errors,[]);
 console.log('PASS simulated browser:',mode);scenarios++;
 await context.close();
}
try{for(const mode of ['challenge-success','initiate-network-error','device-network-error','challenge-network-error'])await scenario(mode);}
finally{await browser.close();}
console.log(`${scenarios} simulated browser scenarios passed. Real provider and database transaction tests are still required.`);
