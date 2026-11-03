/** Worldpay Payments API integrated 3DS response classifier.
 * Pure, side-effect-free logic. Does not authorise, capture or finalise an order.
 * Unknown and ambiguous outcomes always stop payment progression.
 */
export const THREE_DS_STEPS = Object.freeze({
  DEVICE_DATA: 'device_data',
  CHALLENGE: 'challenge',
  AUTHORISED: 'authorised',
  SETTLEMENT_REQUESTED: 'settlement_requested',
  DECLINED: 'declined',
  UNKNOWN: 'unknown',
});

function action(data, key) {
  const value = data?._actions?.[key];
  if (!value || value.method !== 'POST' || typeof value.href !== 'string') return null;
  let url;
  try { url = new URL(value.href); } catch { return null; }
  if (url.origin !== 'https://try.access.worldpay.com' || url.search || url.hash || url.username || url.password ||
      !url.pathname.startsWith('/api/payments/')) return null;
  return { href: url.href, method: 'POST' };
}

/** Reject insecure and obvious non-public destination URLs before rendering browser forms. */
function validHttpsSecurityUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.hash && !u.port &&
      u.hostname.includes('.') && !u.hostname.endsWith('.local') && !u.hostname.endsWith('.internal') &&
      !u.hostname.endsWith('.localhost') &&
      !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname);
  } catch { return false; }
}

/** Only handle the outcomes explicitly documented and expected from Integrated 3DS. */
export function classifyIntegrated3DS(data, status) {
  if (typeof data !== 'object' || data === null || Array.isArray(data) || status < 200 || status >= 300)
    return { step: THREE_DS_STEPS.UNKNOWN };
  if (data.outcome === '3dsDeviceDataRequired') {
    const next = action(data, 'supply3dsDeviceData');
    const ddc = data.deviceDataCollection;
    if (!next || typeof ddc?.jwt !== 'string' || typeof ddc?.url !== 'string' ||
        !validHttpsSecurityUrl(ddc.url)) return { step: THREE_DS_STEPS.UNKNOWN };
    return { step: THREE_DS_STEPS.DEVICE_DATA, next, deviceDataCollection: { jwt: ddc.jwt, url: ddc.url,
      ...(typeof ddc.bin === 'string' ? { bin: ddc.bin } : {}),
    } };
  }
  if (data.outcome === '3dsChallenged') {
    const next = action(data, 'complete3dsChallenge');
    const challenge = data.challenge;
    if (!next || typeof challenge?.url !== 'string' || !validHttpsSecurityUrl(challenge.url) ||
        typeof challenge?.jwt !== 'string' || typeof challenge?.reference !== 'string')
      return { step: THREE_DS_STEPS.UNKNOWN };
    return { step: THREE_DS_STEPS.CHALLENGE, next, challenge: {
      url: challenge.url, jwt: challenge.jwt, reference: challenge.reference,
      ...(typeof challenge.payload === 'string' ? { payload: challenge.payload } : {}),
    }};
  }
  if (data.outcome === 'authorized' || data.outcome === 'authorised')
    return { step: THREE_DS_STEPS.AUTHORISED };
  if (data.outcome === 'sentForSettlement' || data.outcome === 'sent for settlement')
    return { step: THREE_DS_STEPS.SETTLEMENT_REQUESTED };
  if (data.outcome === 'refused' || data.outcome === 'fraudHighRisk' || data.outcome === '3dsAuthenticationFailed')
    return { step: THREE_DS_STEPS.DECLINED };
  return { step: THREE_DS_STEPS.UNKNOWN };
}

/** Transitions requiring operator-controlled persistence; not a source of payment truth. */
export function mayContinue3DS(currentStep, requestedAction) {
  return (currentStep === THREE_DS_STEPS.DEVICE_DATA && requestedAction === 'supply3dsDeviceData') ||
    (currentStep === THREE_DS_STEPS.CHALLENGE && requestedAction === 'complete3dsChallenge');
}
