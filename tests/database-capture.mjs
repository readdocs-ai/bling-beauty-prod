/** Runs real PL/pgSQL in a disposable embedded PostgreSQL database.
 * Does not access Supabase or a payment provider. This is not a multi-session contention test.
 */
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {PGlite}=createRequire(import.meta.url)(process.env.BLING_PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
try{
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 for(const file of ['bling-checkout-attempts.sql','bling-paid-order-finalisation.sql','worldpay-payment-lock-and-finalisation-v2.sql','worldpay-persistent-attempts-v3.sql','worldpay-preview-attempt-ownership-v4.sql','worldpay-continuation-claims-v5.sql','worldpay-challenge-return-v6.sql','migrations/20261026215839_worldpay_single_capture.sql'])
  await db.exec(readFileSync('supabase/'+file,'utf8'));
 await db.exec('grant all on all tables in schema public to service_role;');
 const ref='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',paymentClaim='11111111-1111-4111-8111-111111111111',captureClaim='22222222-2222-4222-8222-222222222222',secret='a'.repeat(64);
 await db.query(`insert into public.bling_checkout_attempts(reference,status,amount_pence,currency,items,customer,shipping,payment_claim_id,browser_secret_sha256,provider_outcome,provider_actions) values ($1,'payment_processing',13000,'GBP','[]','{}','{}',$2,$3,'authorised',$4)`,[ref,paymentClaim,secret,JSON.stringify({settlePayment:'https://try.access.worldpay.com/api/payments/opaque/settlements'})]);
 const claim=async(hash=secret,amount=13000)=>{
  const r=await db.query('select public.bling_claim_settlement($1,$2,$3,$4,$5,$6,$7) as claim',[ref,paymentClaim,hash,captureClaim,'pay_test_123',amount,'https://try.access.worldpay.com/api/payments/opaque/settlements']);return r.rows[0].claim;
 };
 await db.exec('set role anon;');await assert.rejects(claim());await db.exec('reset role;set role authenticated;');await assert.rejects(claim());
 await db.exec('reset role;set role service_role;');
 assert.equal(await claim('b'.repeat(64)),null);assert.equal(await claim(secret,1),null);
 assert.equal((await claim()).action,'https://try.access.worldpay.com/api/payments/opaque/settlements');
 assert.equal(await claim(),null);
 const record=async(token,outcome)=>{const r=await db.query("select public.bling_store_settlement_progress($1,$2,$3,$4,'{}',null) as ok",[ref,paymentClaim,token,outcome]);return r.rows[0].ok;};
 assert.equal(await record('33333333-3333-4333-8333-333333333333','settlement_requested'),false);
 assert.equal(await record(captureClaim,'authorised'),false);
 assert.equal(await record(captureClaim,'settlement_requested'),true);
 assert.equal(await record(captureClaim,'settlement_requested'),false);
 assert.equal(await claim(),null);
 const row=(await db.query('select status,provider_outcome,provider_continuation_claim,provider_continuation_stage from public.bling_checkout_attempts where reference=$1',[ref])).rows[0];
 assert.equal(row.status,'payment_processing');assert.equal(row.provider_outcome,'settlement_requested');assert.equal(row.provider_continuation_claim,captureClaim);assert.equal(row.provider_continuation_stage,'capture');
 await assert.rejects(db.query('select public.bling_finalise_verified_payment($1,$2)',[ref,'pay_test_123']));
 assert.equal((await db.query('select count(*)::int as n from public.bling_paid_orders')).rows[0].n,0);
 console.log('PASS: PostgreSQL executes the capture RPCs; private roles denied, wrong ownership/amount denied, claim consumed once, capture progress cannot create paid orders.');
}finally{await db.close();}
