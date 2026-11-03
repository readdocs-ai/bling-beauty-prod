import assert from 'node:assert/strict';
import { previewReturnUrl } from './lib/worldpay/preview-return-url.mjs';
const env = {VERCEL_ENV:'preview',WORLDPAY_ENVIRONMENT:'try',
  VERCEL_URL:'bling-immutable.vercel.app', VERCEL_BRANCH_URL:'bling-worldpay-testing.vercel.app'};
const path = '/api/worldpay/preview-challenge-return';
for (const host of [env.VERCEL_URL,env.VERCEL_BRANCH_URL])
  assert.equal(previewReturnUrl(`https://${host}/api/worldpay/preview-initiate`,env),`https://${host}${path}`);
for (const url of ['https://evil.vercel.app/api/worldpay/preview-initiate',
  'https://bling-immutable.vercel.app.evil.example/', 'http://bling-immutable.vercel.app/',
  'https://bling-immutable.vercel.app:3000/', 'https://user@bling-immutable.vercel.app/'])
  assert.throws(()=>previewReturnUrl(url,env));
assert.throws(()=>previewReturnUrl('https://bling-immutable.vercel.app/',{...env,VERCEL_ENV:'production'}));
assert.throws(()=>previewReturnUrl('https://bling-immutable.vercel.app/',{...env,WORLDPAY_ENVIRONMENT:'live'}));
assert.throws(()=>previewReturnUrl('https://bling-immutable.vercel.app/',{VERCEL_ENV:'preview',WORLDPAY_ENVIRONMENT:'try'}));
console.log('PASS: Preview callback stays on an explicitly trusted checkout origin; unexpected origins fail before a claim');
