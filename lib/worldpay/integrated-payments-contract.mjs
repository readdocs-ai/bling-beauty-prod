/** Payments API (2024-06-01) request/response policy; no network, no secrets. */
export const API_VERSION = '2024-06-01';
const ROOT = 'https://try.access.worldpay.com';
export function safeIntegratedAction(href, kind = 'any') {
  if (typeof href !== 'string' || href.length > 4096) throw new Error('Invalid provider action');
  const u = new URL(href);
  if (u.origin !== ROOT || u.search || u.hash || u.username || u.password ||
      !/^\/api\/payments(?:\/[A-Za-z0-9%._~+:-]+)*(?:\/(?:3dsDeviceData|3dsChallenges|settlements))?$/.test(u.pathname))
    throw new Error('Rejected provider action');
  const suffix = { query: '', device: '/3dsDeviceData', challenge: '/3dsChallenges', settle: '/settlements' }[kind];
  if (kind !== 'any' && (suffix === undefined || (kind === 'query' && /\/(?:3dsDeviceData|3dsChallenges|settlements)$/.test(u.pathname)) || (suffix && !u.pathname.endsWith(suffix))))
    throw new Error('Incorrect action type');
  return u.href;
}
export function checkedProviderResult(status, raw) {
  if (!Number.isInteger(status) || status < 200 || status >= 300 || !raw || typeof raw !== 'object' || Array.isArray(raw))
    return { outcome: 'uncertain', actions: {} };
  const outcomes = new Map([
    ['3dsDeviceDataRequired','device_data'],['3dsChallenged','challenge'],
    ['authorized','authorised'],['sentForSettlement','settlement_requested'],
    ['refused','declined'],['3dsAuthenticationFailed','declined'],['fraudHighRisk','declined'],
  ]);
  const outcome = outcomes.get(raw.outcome) || 'uncertain';
  const actions = {};
  if (raw._actions && typeof raw._actions === 'object') {
    for (const [key, type] of [['supply3dsDeviceData','device'],['complete3dsChallenge','challenge'],['settlePayment','settle']]) {
      const x = raw._actions[key];
      if (x?.method === 'POST') { try { actions[key] = safeIntegratedAction(x.href, type); } catch {} }
    }
  }
  const self = raw._links?.self?.href;
  if (self) { try { actions.query = safeIntegratedAction(self, 'query'); } catch {} }
  if (outcome === 'device_data' && !actions.supply3dsDeviceData) return { outcome:'uncertain',actions:{} };
  if (outcome === 'challenge' && !actions.complete3dsChallenge) return { outcome:'uncertain',actions:{} };
  return { outcome, actions };
}
export function assertMatchingProviderPayment(provider, expected) {
  if (!provider || provider.transactionReference !== expected.reference ||
      provider.instruction?.value?.amount !== expected.amountPence ||
      provider.instruction?.value?.currency !== 'GBP')
    throw new Error('Provider transaction does not match server-stored order');
  return true;
}
