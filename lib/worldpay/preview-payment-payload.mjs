import {LIVE_ORIGINS} from './live-policy.mjs';
/** Pure Payments API (2024-06-01) request builder. Never accepts browser amount/entity. */
const REF = /^BLING-[0-9a-f-]{36}$/;
const SESSION = /^https:\/\/try\.access\.worldpay\.com\/sessions\/[A-Za-z0-9%._~+\-]+$/;
export function buildIntegratedPaymentPayload(order, sessionHref, entity, narrative, threeDS, environment='try') {
  if(!['try','live'].includes(environment))throw Error('Invalid payment environment');
  const sessionPattern=environment==='try'?SESSION:/^https:\/\/access\.worldpay\.com\/sessions\/[A-Za-z0-9%._~+\-]+$/;
  const callbackValid=environment==='try'?/^https:\/\/[a-z0-9.-]+\.vercel\.app\/api\/worldpay\/preview-challenge-return$/.test(threeDS?.returnUrl??''):LIVE_ORIGINS.some(origin=>threeDS?.returnUrl===`${origin}/api/worldpay/challenge-return`);
  if (!order || !REF.test(order.reference) || order.status !== 'payment_processing' ||
      order.currency !== 'GBP' || !Number.isSafeInteger(order.amount_pence) ||
      order.amount_pence < 1 || order.amount_pence > 1000000) throw Error('Unclaimed or invalid order');
  if (typeof sessionHref !== 'string' || !sessionPattern.test(sessionHref) || sessionHref.length > 1000)
    throw Error('Invalid Worldpay Try checkout session');
  if (typeof entity !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9 ]{0,31}$/.test(entity)) throw Error('Invalid merchant entity');
  if (typeof narrative !== 'string' || !/^[A-Za-z0-9 .-]{3,24}$/.test(narrative)) throw Error('Invalid statement narrative');
  const settlementMode=order.settlement_mode??'manual';
  if(!['manual','auto'].includes(settlementMode))throw Error('Invalid stored settlement mode');
  // An incomplete 3DS configuration must fail before the irreversible payment claim.
  if (!threeDS || typeof threeDS !== 'object' || !callbackValid ||
      typeof threeDS.userAgent !== 'string' || threeDS.userAgent.length < 3 || threeDS.userAgent.length > 512 ||
      !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(threeDS.language ?? '') ||
      !Number.isInteger(threeDS.width) || threeDS.width < 1 || threeDS.width > 20000 ||
      !Number.isInteger(threeDS.height) || threeDS.height < 1 || threeDS.height > 20000 ||
      !Number.isInteger(threeDS.timeZone) || threeDS.timeZone < -840 || threeDS.timeZone > 840)
    throw Error('Invalid integrated 3DS browser configuration');
  return {
    transactionReference: order.reference,
    merchant: { entity }, channel: 'ecom',
    instruction: {
      method: 'card',
      // Snapshot comes from the claimed server row, never a browser option.
      // Keep Worldpay's default cancellation behaviour for AVS/CVC mismatches.
      ...(settlementMode==='auto'?{settlement:{auto:true}}:{}),
      threeDS: {
        type: 'integrated', mode: 'always',
        challenge: { returnUrl: threeDS.returnUrl },
        deviceData: {
          acceptHeader: 'text/html', userAgentHeader: threeDS.userAgent,
          browserLanguage: threeDS.language, browserScreenHeight: threeDS.height,
          browserScreenWidth: threeDS.width, browserJavaEnabled: false,
          browserColorDepth: '32', timeZone: String(threeDS.timeZone),
          browserJavascriptEnabled: true, channel: 'browser',
        },
      },
      paymentInstrument: { type: 'checkout', sessionHref },
      narrative: { line1: narrative },
      value: { currency: 'GBP', amount: order.amount_pence },
    },
  };
}

export function buildTryPaymentPayload(...args) {return buildIntegratedPaymentPayload(...args);}
