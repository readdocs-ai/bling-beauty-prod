const EMAIL=/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
export function emailDeliverySettings(env,environment,recipients){
 if(env.BLING_ORDER_EMAILS_ENABLED!=='true')throw Error('Order email delivery is disabled');
 if(!['try','live'].includes(environment)||environment!==env.WORLDPAY_ENVIRONMENT)throw Error('Email environment mismatch');
 if(environment==='live'&&env.VERCEL_ENV!=='production')throw Error('Live email requires production');
 if(environment==='try'&&env.VERCEL_ENV!=='preview')throw Error('Test email requires Preview');
 if(!recipients.every(x=>typeof x==='string'&&EMAIL.test(x)))throw Error('Invalid recipient');
 if(environment==='try'){
  const allowed=(env.BLING_TEST_EMAIL_RECIPIENTS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!recipients.every(x=>allowed.includes(x.toLowerCase())))throw Error('Test recipient is not allowlisted');
 }
 return {prefix:environment==='try'?'[TEST] ':''};
}
export function emailIdempotencyKey(environment,orderId,kind){
 if(!['try','live'].includes(environment)||!/^[-a-f0-9]{36}$/.test(orderId)||!['customer_email','admin_email'].includes(kind))throw Error('Invalid email job');
 return `bling/${environment}/${orderId}/${kind}/v1`;
}
