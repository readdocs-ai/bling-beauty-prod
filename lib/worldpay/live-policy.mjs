/** Public-origin and environment policy. No network calls or secret values returned. */
export const LIVE_ORIGINS = ['https://blingbeautyproducts.com', 'https://www.blingbeautyproducts.com'];
export function liveOrigin(env) {
 const value=env.NEXT_PUBLIC_SITE_URL;
 if(!LIVE_ORIGINS.includes(value))throw Error('Live public origin is not configured');
 return value;
}
export function signingKeysConfigured(raw) {
 try {const keys=JSON.parse(raw??'');return keys&&typeof keys==='object'&&!Array.isArray(keys)&&
  Object.keys(keys).length>0&&Object.entries(keys).every(([id,key])=>/^[0-9]{1,10}$/.test(id)&&typeof key==='string'&&key.trim().length>0);}catch{return false;}
}
export function liveReadiness(env) {
 const checks={production:env.VERCEL_ENV==='production',liveEnvironment:env.WORLDPAY_ENVIRONMENT==='live',
  enabled:env.BLING_LIVE_CHECKOUT_ENABLED==='true',
  apiUsername:!!env.WORLDPAY_API_USERNAME?.trim(),apiPassword:!!env.WORLDPAY_API_PASSWORD?.trim(),
  merchantEntity:!!env.WORLDPAY_ENTITY?.trim(),narrative:/^[A-Za-z0-9 .-]{3,24}$/.test(env.WORLDPAY_STATEMENT_NARRATIVE??''),
  checkoutId:/^[A-Za-z0-9_-]{8,150}$/.test(env.WORLDPAY_CHECKOUT_ID??''),
  origin:LIVE_ORIGINS.includes(env.NEXT_PUBLIC_SITE_URL),
  signedEvents:env.BLING_LIVE_SETTLEMENT_EVENTS==='true'&&signingKeysConfigured(env.WORLDPAY_EVENT_SIGNING_KEYS),
  emails:env.BLING_ORDER_EMAILS_ENABLED==='true'&&!!env.RESEND_API_KEY?.trim(),
  recovery:!!env.CRON_SECRET?.trim()};
 return {ready:Object.values(checks).every(Boolean),checks};
}
export function assertLiveRuntime(env) {
 if(env.VERCEL_ENV!=='production'||env.WORLDPAY_ENVIRONMENT!=='live')throw Error('Live payment runtime unavailable');
 const username=env.WORLDPAY_API_USERNAME?.trim(),password=env.WORLDPAY_API_PASSWORD?.trim(),entity=env.WORLDPAY_ENTITY?.trim();
 if(!username||!password||!entity)throw Error('Live credentials incomplete');
 return {username,password,entity,origin:'https://access.worldpay.com'};
}
export function liveReturnUrl(requestUrl,env) {
 liveOrigin(env);
 const u=new URL(requestUrl);
 if(!LIVE_ORIGINS.includes(u.origin)||u.username||u.password)throw Error('Unrecognised checkout origin');
 return `${u.origin}/api/worldpay/challenge-return`;
}
