/** Official WPecom webhook sources, verified 31 October 2026.
 * https://docs.worldpay.com/access/products/hosted-payment-pages/webhooks
 * Enforce this same list at Vercel's firewall. Checkout remains Access API. */
export const WORLDPAY_WEBHOOK_IPS=Object.freeze([
 '34.246.73.11','52.215.22.123','52.31.61.0','18.130.125.132','35.176.91.145','52.56.235.128',
 '18.185.7.67','18.185.134.117','18.185.158.215','52.48.6.187','34.243.65.63','3.255.13.18',
 '3.251.36.74','63.32.208.6','52.19.45.138','3.11.50.124','3.11.213.43','3.14.190.43',
 '3.121.172.32','3.125.11.252','3.126.98.120','3.139.153.185','3.139.255.63','13.200.51.10',
 '13.200.56.25','13.232.151.127','34.236.63.10','34.253.172.98','35.170.209.108',
 '35.177.246.6','52.4.68.25','52.51.12.88','108.129.30.203',
]);
export function wpecomEventsConfigured(env){return env.VERCEL==='1'&&env.VERCEL_ENV==='production'&&env.WORLDPAY_ENVIRONMENT==='live'&&env.WORLDPAY_WEBHOOK_AUTH==='worldpay_ip'&&env.BLING_WPECOM_FIREWALL_VERIFIED==='true';}
export function trustedWorldpaySource(headers,env){
 if(!wpecomEventsConfigured(env))return null;
 // Vercel overwrites this with the actual peer. Do not accept arbitrary XFF chains.
 const ip=headers.get('x-vercel-forwarded-for')?.trim();
 return typeof ip==='string'&&WORLDPAY_WEBHOOK_IPS.includes(ip)?ip:null;
}
export function parseWpecomEvent(raw,environment,sourceIp,expectedEntity){
 if(environment!=='live'||!WORLDPAY_WEBHOOK_IPS.includes(sourceIp)||!expectedEntity)throw Error('Untrusted event');
 const body=JSON.parse(raw.toString('utf8')),d=body?.eventDetails;
 if(typeof body?.eventId!=='string'||!/^[-A-Za-z0-9_]{3,128}$/.test(body.eventId)||typeof body.eventTimestamp!=='string'||body.eventTimestamp.length>64||!Number.isFinite(Date.parse(body.eventTimestamp)))throw Error('Invalid event');
 if(d?.classification!=='payment'||d.type!=='sentForSettlement')return null;
 if(!/^BLING-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(d.transactionReference??'')||d.amount?.currencyCode!=='GBP'||!Number.isSafeInteger(d.amount?.value)||d.amount.value<1||d.merchant?.entity!==expectedEntity||!/^[A-Za-z0-9_-]{3,128}$/.test(d.paymentId??''))throw Error('Invalid payment confirmation');
 return {environment,event_id:body.eventId,reference:d.transactionReference,amount_pence:d.amount.value,event_timestamp:body.eventTimestamp,event_type:'sentForSettlement',authentication_method:'worldpay_ip',provider_payment_id:d.paymentId,merchant_entity:d.merchant.entity,source_ip:sourceIp};
}
export function matchesWpecomQuery(event,attempt,query,expectedEntity){
 return event?.environment==='live'&&event.event_type==='sentForSettlement'&&event.authentication_method==='worldpay_ip'&&WORLDPAY_WEBHOOK_IPS.includes(event.source_ip)&&event.merchant_entity===expectedEntity&&attempt?.payment_environment==='live'&&attempt.currency==='GBP'&&attempt.settlement_mode==='auto'&&attempt.reference===event.reference&&attempt.amount_pence===event.amount_pence&&!!attempt.payment_claim_id&&['payment_processing','paid_verified'].includes(attempt.status)&&(attempt.provider_payment_id===null||attempt.provider_payment_id===event.provider_payment_id)&&query?.state==='pending'&&query.paymentId===event.provider_payment_id&&query.event==='settlementrequestsubmitted';
}
