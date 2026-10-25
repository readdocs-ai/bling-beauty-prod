import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('./app/api/worldpay/preview-device-data/route.ts',import.meta.url),'utf8');
const cases=[
 /BLING_PREVIEW_3DS_DEVICE_CONTINUATION/, /VERCEL_ENV !== 'preview'/,
 /ownershipSecret: z\.string\(\)\.regex/, /collectionReference: z\.string\(\)\.min\(1\)\.max\(200\)/,
 /\.select\('payment_claim_id,status,provider_outcome'\)/,
 /claim3dsContinuation\(reference,attempt\.payment_claim_id,ownershipSecret,'device_data'\)/,
 /advanceDeviceData\(claimed\.action,\{collectionReference\}\)/,
 /record3dsContinuation\(reference,attempt\.payment_claim_id,claimed\.continuationClaim,response\)/,
 /if \(!claimed\) return fail\(409\)/,
 /Leave the continuation claimed for reconciliation/,
];
for(const c of cases)assert.match(source,c);
assert.doesNotMatch(source,/paymentEnabled:\s*true|paid_verified|requestSettlement\(/);
console.log('Device data continuation route structure:',cases.length+1,'checks passed');
