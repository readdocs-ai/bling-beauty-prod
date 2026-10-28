// Dependency-free structural safety checks; do NOT stand in for Next.js or integration tests.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const checkout = read('./app/api/worldpay/preview-prepare/route.ts');
const transport = read('./lib/worldpay/access-client.ts');
const readiness = read('./app/api/worldpay/preview-readiness/route.ts');
const ui = read('./components/worldpay/preview-fields.tsx');
assert.match(checkout, /status:\s*'pending'/);
assert.match(checkout, /VERCEL_ENV !== 'preview'/);
assert.match(checkout, /WORLDPAY_ENVIRONMENT !== 'try'/);
assert.doesNotMatch(checkout, /finalisePayment\(/);
assert.match(ui, /No payment has been attempted/);
assert.match(transport, /safeWorldpayLink\(new URL\(/);
assert.match(transport, /parsed\.origin !== "https:\/\/try\.access\.worldpay\.com"/);
assert.match(readiness, /404/);
console.log('PASS: 8 static safety assertions (not transaction or build tests)');
