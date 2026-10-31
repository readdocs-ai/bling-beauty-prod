import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const {PGlite}=createRequire(import.meta.url)(process.env.BLING_PGLITE_MODULE||'@electric-sql/pglite');const db=new PGlite();
try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 for(const file of ['bling-checkout-attempts.sql','bling-paid-order-finalisation.sql','worldpay-payment-lock-and-finalisation-v2.sql','worldpay-persistent-attempts-v3.sql','worldpay-preview-attempt-ownership-v4.sql','worldpay-continuation-claims-v5.sql','worldpay-challenge-return-v6.sql','migrations/20261026215839_worldpay_single_capture.sql','migrations/20261026223857_worldpay_verified_order_delivery.sql','migrations/20261028192118_worldpay_auto_settlement.sql','migrations/20261031092659_wpecom_verified_capture.sql'])await db.exec(readFileSync('supabase/'+file,'utf8'));
 await db.exec('grant all on all tables in schema public to service_role;');
 const ref='BLING-aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',claim='11111111-1111-4111-8111-111111111111',hash='a'.repeat(64);
 await db.query("insert into bling_checkout_attempts(reference,status,amount_pence,items,customer,shipping,payment_claim_id,payment_environment,settlement_mode) values($1,'payment_processing',13000,'[]','{}','{}',$2,'live','auto')",[ref,claim]);
 await db.query("insert into bling_worldpay_settlement_events(environment,event_id,reference,amount_pence,event_timestamp,body_sha256,event_type,authentication_method,provider_payment_id,merchant_entity,source_ip) values('live','event_fixture',$1,13000,now(),$2,'sentForSettlement','worldpay_ip','pay_fixture','merchant_fixture','34.246.73.11')",[ref,hash]);
 const commit=(payment='pay_fixture',entity='merchant_fixture',event='settlementrequestsubmitted',token=claim)=>db.query("select bling_commit_wpecom_event('live','event_fixture',$1,$2,$3,$4,$5) as id",[hash,token,payment,entity,event]);
 await db.exec('set role anon');await assert.rejects(commit());await db.exec('reset role;set role authenticated');await assert.rejects(commit());await db.exec('reset role;set role service_role');
 await assert.rejects(commit('other'));await assert.rejects(commit('pay_fixture','other'));await assert.rejects(commit('pay_fixture','merchant_fixture','settlementrequested'));await assert.rejects(commit('pay_fixture','merchant_fixture','settlementrequestsubmitted','22222222-2222-4222-8222-222222222222'));
 await db.query("update bling_worldpay_settlement_events set amount_pence=1");await assert.rejects(commit());await db.query("update bling_worldpay_settlement_events set amount_pence=13000,source_ip='203.0.113.1'");await assert.rejects(commit());await db.query("update bling_worldpay_settlement_events set source_ip='34.246.73.11'");
 await assert.rejects(db.query("select bling_commit_settled_event('live','event_fixture',$1,$2,'pay_fixture')",[hash,claim]));
 const id=(await commit()).rows[0].id;assert.ok(id);assert.equal((await commit()).rows[0].id,id);
 assert.equal((await db.query('select count(*)::int as n from bling_paid_orders')).rows[0].n,1);assert.equal((await db.query('select count(*)::int as n from bling_paid_order_jobs')).rows[0].n,3);
 assert.equal((await db.query('select payment_confirmation_stage from bling_paid_orders')).rows[0].payment_confirmation_stage,'settlement_submitted');assert.equal((await db.query('select provider_last_event from bling_checkout_attempts')).rows[0].provider_last_event,'sentForSettlement');
 console.log('PASS actual PostgreSQL WPecom RPC: public role denial, hash/claim/source/merchant/amount/payment validation, separate capture stage, one order and three jobs on replay. Synthetic fixture only.');
}finally{await db.close();}
