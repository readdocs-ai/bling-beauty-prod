import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const {PGlite}=createRequire(import.meta.url)(process.env.BLING_PGLITE_MODULE||'@electric-sql/pglite');const db=new PGlite();
try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 for(const file of ['bling-checkout-attempts.sql','bling-paid-order-finalisation.sql','worldpay-payment-lock-and-finalisation-v2.sql','worldpay-persistent-attempts-v3.sql','worldpay-preview-attempt-ownership-v4.sql','worldpay-continuation-claims-v5.sql','worldpay-challenge-return-v6.sql','migrations/20261026215839_worldpay_single_capture.sql','migrations/20261026223857_worldpay_verified_order_delivery.sql','migrations/20261028192118_worldpay_auto_settlement.sql'])await db.exec(readFileSync('supabase/'+file,'utf8'));
 await db.exec('grant all on all tables in schema public to service_role;');
 const ref='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',claim='11111111-1111-4111-8111-111111111111',hash='a'.repeat(64);
 await db.query("insert into bling_checkout_attempts(reference,status,amount_pence,items,customer,shipping,payment_claim_id,provider_payment_id,payment_environment) values($1,'payment_processing',13000,'[]','{}','{}',$2,'pay_test','try')",[ref,claim]);
 await db.query("insert into bling_worldpay_settlement_events(environment,event_id,reference,amount_pence,event_timestamp,body_sha256) values('try','event_test',$1,13000,now(),$2)",[ref,hash]);
 const commit=(env='try',digest=hash,token=claim)=>db.query('select bling_commit_settled_event($1,$2,$3,$4,$5) as id',[env,'event_test',digest,token,'pay_test']);
 await db.exec('set role anon;');await assert.rejects(commit());await db.exec('reset role;set role authenticated;');await assert.rejects(commit());await db.exec('reset role;set role service_role;');
 await assert.rejects(commit('live'));await assert.rejects(commit('try','b'.repeat(64)));await assert.rejects(commit('try',hash,'22222222-2222-4222-8222-222222222222'));
 await db.query('update bling_worldpay_settlement_events set amount_pence=1');await assert.rejects(commit());await db.query('update bling_worldpay_settlement_events set amount_pence=13000');
 assert.equal((await db.query('select count(*)::int as n from bling_paid_orders')).rows[0].n,0);
 const id=(await commit()).rows[0].id;assert.ok(id);assert.equal((await commit()).rows[0].id,id);
 assert.equal((await db.query('select count(*)::int as n from bling_paid_orders')).rows[0].n,1);
 assert.equal((await db.query('select count(*)::int as n from bling_paid_order_jobs')).rows[0].n,3);
 assert.equal((await db.query('select status from bling_checkout_attempts')).rows[0].status,'paid_verified');
 assert.equal((await db.query('select payment_environment from bling_paid_orders')).rows[0].payment_environment,'try');
 await assert.rejects(db.query("insert into bling_worldpay_settlement_events(environment,event_id,reference,amount_pence,event_timestamp,body_sha256) values('try','event_test',$1,13000,now(),$2)",[ref,hash]));

 const autoRef='BLING-bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
 await db.query("insert into bling_checkout_attempts(reference,status,amount_pence,items,customer,shipping,payment_claim_id,payment_environment,provider_outcome,settlement_mode,browser_secret_sha256) values($1,'payment_processing',13000,'[]','{}','{}',$2,'try','authorised','auto',$3)",[autoRef,'22222222-2222-4222-8222-222222222222','a'.repeat(64)]);
 const deniedCapture=await db.query("select bling_claim_settlement($1,$2,$3,$4,'pay_auto_123',13000,'https://try.access.worldpay.com/api/payments/opaque/settlements') as claim",[autoRef,'22222222-2222-4222-8222-222222222222','a'.repeat(64),'33333333-3333-4333-8333-333333333333']);
 assert.equal(deniedCapture.rows[0].claim,null);
 await db.query("insert into bling_worldpay_settlement_events(environment,event_id,reference,amount_pence,event_timestamp,body_sha256) values('try','event_auto',$1,13000,now(),$2)",[autoRef,hash]);
 const autoCommit=(payment='pay_auto_123')=>db.query("select bling_commit_settled_event('try','event_auto',$1,$2,$3) as id",[hash,'22222222-2222-4222-8222-222222222222',payment]);
 await assert.rejects(autoCommit('invalid/payment'));
 const autoId=(await autoCommit()).rows[0].id;assert.ok(autoId);assert.equal((await autoCommit()).rows[0].id,autoId);
 await assert.rejects(autoCommit('pay_wrong'));
 assert.equal((await db.query('select provider_payment_id from bling_checkout_attempts where reference=$1',[autoRef])).rows[0].provider_payment_id,'pay_auto_123');
 assert.equal((await db.query('select count(*)::int as n from bling_paid_orders')).rows[0].n,2);
 assert.equal((await db.query('select count(*)::int as n from bling_paid_order_jobs')).rows[0].n,6);
 // A manual attempt with no recorded provider ID cannot use automatic binding.
 await db.query("update bling_checkout_attempts set status='payment_processing',provider_payment_id=null where reference=$1",[ref]);
 await db.query("update bling_worldpay_settlement_events set status='pending' where event_id='event_test'");
 await assert.rejects(commit());

 await db.query("update bling_worldpay_settlement_events set last_checked_at=now() where status='pending'");
 for(const eventId of ['queued_first','queued_second'])await db.query("insert into bling_worldpay_settlement_events(environment,event_id,reference,amount_pence,event_timestamp,body_sha256) values('try',$1,$2,13000,now(),$3)",[eventId,autoRef,hash]);
 const next=()=>db.query("select event_id from bling_worldpay_settlement_events where environment='try' and status='pending' order by last_checked_at asc nulls first,received_at asc,event_id asc limit 1");
 const first=(await next()).rows[0].event_id;assert.equal(first,'queued_first');
 await db.query('update bling_worldpay_settlement_events set last_checked_at=now() where event_id=$1',[first]);
 assert.equal((await next()).rows[0].event_id,'queued_second');
 console.log('PASS: deferred receipts rotate behind unchecked receipts.');
 console.log('PASS: automatic policy rejects manual capture; independently matched signed settlement binds provider ID once; manual missing-ID and changed-ID cases remain blocked.');
 console.log('PASS: PostgreSQL atomically finalises a synthetic verified event once; denies public roles, mismatched environment/hash/claim/amount; creates one order and three jobs. No real provider event asserted.');
}finally{await db.close();}
