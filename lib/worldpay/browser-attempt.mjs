/** Tab-scoped recovery only. Never stores card data, card sessions or 3DS JWTs.
 * An unresolved submission is not automatically released by refresh or expiry.
 * The server's atomic claim remains the authority for duplicate protection.
 */
function storageKey(environment='try'){if(!['try','live'].includes(environment))throw Error('Invalid environment');return environment==='try'?'bling_worldpay_attempt_v1':'bling_worldpay_live_attempt_v1';}
function validate(value) {
  if (!value || value.version !== 1 || !/^BLING-[0-9a-f-]{36}$/.test(value.reference ?? '') ||
      !/^[a-f0-9]{64}$/.test(value.ownershipSecret ?? '') ||
      !/^[A-Za-z0-9_-]{8,150}$/.test(value.checkoutId ?? '') ||
      typeof value.submitted !== 'boolean') throw new Error('Stored payment attempt needs review');
  return {version:1,reference:value.reference,ownershipSecret:value.ownershipSecret,
    checkoutId:value.checkoutId,submitted:value.submitted};
}
export function readBrowserAttempt(storage,environment='try') {
  const raw = storage.getItem(storageKey(environment));
  return raw === null ? null : validate(JSON.parse(raw));
}
export function saveBrowserAttempt(storage, attempt,environment='try') {
  const next = validate(attempt);
  const existing = readBrowserAttempt(storage,environment);
  if (existing && (existing.reference !== next.reference || existing.ownershipSecret !== next.ownershipSecret ||
      existing.checkoutId !== next.checkoutId || (existing.submitted && !next.submitted)))
    throw new Error('An existing payment attempt must be checked first');
  storage.setItem(storageKey(environment), JSON.stringify(next));
  if (storage.getItem(storageKey(environment)) !== JSON.stringify(next)) throw new Error('Payment recovery is unavailable');
  return next;
}
export function markBrowserAttemptSubmitted(storage, reference,environment='try') {
  const current = readBrowserAttempt(storage,environment);
  if (!current || current.reference !== reference || current.submitted)
    throw new Error('Payment already submitted or recovery unavailable');
  return saveBrowserAttempt(storage,{...current,submitted:true},environment);
}

/** Only call after owner-authenticated server status confirms paid_verified. */
export function clearPaidBrowserAttempt(storage,reference,environment='try'){const current=readBrowserAttempt(storage,environment);if(current?.reference===reference)storage.removeItem(storageKey(environment));}
