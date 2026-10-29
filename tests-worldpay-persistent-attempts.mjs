import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const sql=readFileSync('supabase/worldpay-persistent-attempts-v3.sql','utf8');
const gateway=readFileSync('lib/worldpay/persistent-attempt.ts','utf8');
const api=readFileSync('app/api/worldpay/preview-attempt-status/route.ts','utf8');
const cart=readFileSync('app/cart/page.tsx','utf8');
const tests = [
  ['service-only RPC', sql.includes('GRANT EXECUTE ON FUNCTION public.bling_store_provider_progress') && sql.includes('TO service_role')],
  ['claim compare-and-swap', gateway.includes("rpc('bling_claim_payment'")],
  ['persist only claimed',sql.includes('payment_claim_id=p_claim') && sql.includes("status='payment_processing'")],
  ['no paid finaliser',!gateway.includes('bling_finalise_verified_payment')],
  ['revalidated provider response',gateway.includes('checkedProviderResult(response.httpStatus,response.data,environment)')],
  ['no automatic retry',gateway.includes('do not retry payment')],
  ['preview-only status',api.includes("process.env.VERCEL_ENV !== 'preview'")],
  ['no sensitive fields returned',gateway.includes('providerStage:') && !api.includes('payment_claim_id')],
  ['actual cart status link',cart.includes('checkPreviewStatus()') && cart.includes('preview-attempt-status')],
  ['merchant production gated',api.includes("process.env.WORLDPAY_ENVIRONMENT !== 'try'")],
];
for(const [name,pass] of tests) {assert.ok(pass,name); console.log('PASS',name)}
