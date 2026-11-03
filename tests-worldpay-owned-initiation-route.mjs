import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('./app/api/worldpay/preview-initiate/route.ts',import.meta.url),'utf8');
for (const required of [
  "process.env.VERCEL_ENV !== 'preview'",
  "process.env.WORLDPAY_ENVIRONMENT !== 'try'",
  'claimOwnedPreviewAttempt(reference, ownershipSecret)',
  'buildTryPaymentPayload(owned.attempt,sessionHref,entity,narrative,threeDS)',
  'createIntegratedPayment(payload)',
  'storeVerifiedProviderProgress(reference,owned.claim,response)',
  "return fail('Payment attempt already claimed or ownership invalid', 409)",
  'Payment status is unresolved. Do not retry',
  'providerStage: recorded.outcome',
]) assert.ok(src.includes(required), `missing: ${required}`);
assert.ok(!src.includes('paid_verified'), 'route must not mark orders paid');
assert.ok(!src.includes('requestSettlement('), 'route must not settle without verified 3DS');
console.log('11 initiation structural guards passed');
