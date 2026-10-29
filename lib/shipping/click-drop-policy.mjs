/** Royal Mail's documented domestic draft-order contract; no network or secrets. */
export const TRADING_NAME='Bling Beauty Products';
const REFERENCE=/^BLING-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function royalMailReference(reference){if(!REFERENCE.test(reference??''))throw Error('Invalid Bling reference');return 'BLING-'+reference.slice(6).replaceAll('-','');}
function text(value,max,label){if(typeof value!=='string'||!value.trim()||value.trim().length>max||/[\r\n\x00-\x1f]/.test(value))throw Error(`Check ${label}`);return value.trim();}
export function prepareRoyalMailDraft(order,packing){
 if(order?.status!=='paid'||order.payment_environment!=='live'||!order.provider_payment_id||!order.provider_event_id||!order.verified_at||order.currency!=='GBP')throw Error('A verified Live paid order is required');
 const reference=royalMailReference(order.reference),shipping=order.shipping;
 if(!shipping||shipping.country!=='GB')throw Error('Only domestic GB addresses are supported by this import');
 const postcode=text(shipping.postcode,16,'postcode').toUpperCase();
 if(!/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/.test(postcode))throw Error('Check the UK postcode');
 if(/^(BT|GY|JE|IM)/.test(postcode))throw Error('This destination requires manual Royal Mail processing');
 if(!Number.isSafeInteger(order.amount_pence)||order.amount_pence<1||!Number.isSafeInteger(packing?.taxPence)||packing.taxPence<0||packing.taxPence>order.amount_pence)throw Error('Enter the actual tax included in the order total');
 if(!Number.isSafeInteger(packing?.weightGrams)||packing.weightGrams<1||packing.weightGrams>30000)throw Error('Enter the measured packed weight in grams (1–30000)');
 if(!['smallParcel','mediumParcel','largeParcel','parcel'].includes(packing.packageFormat))throw Error('Choose the actual parcel format');
 if(!Number.isFinite(Date.parse(order.created_at)))throw Error('Order creation date unavailable');
 const email=text(order.customer?.email,254,'customer email');if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))throw Error('Check customer email');
 const address={fullName:text(order.customer?.name,210,'recipient name'),addressLine1:text(shipping.address1,100,'address line 1'),
  ...(shipping.address2?{addressLine2:text(shipping.address2,100,'address line 2')}:{}),city:text(shipping.city,100,'city'),postcode,countryCode:'GB'};
 return {items:[{orderReference:reference,orderDate:new Date(order.created_at).toISOString(),recipient:{address,emailAddress:email,
  ...(order.customer?.phone?{phoneNumber:text(order.customer.phone,25,'phone number')}: {})},sender:{tradingName:TRADING_NAME},
  packages:[{weightInGrams:packing.weightGrams,packageFormatIdentifier:packing.packageFormat}],
  subtotal:(order.amount_pence-packing.taxPence)/100,orderTax:packing.taxPence/100,shippingCostCharged:0,total:order.amount_pence/100,currencyCode:'GBP'}]};
}
export function checkedRoyalMailOrder(raw,reference){
 if(!raw||raw.orderReference!==reference||!Number.isSafeInteger(raw.orderIdentifier)||raw.orderIdentifier<1)throw Error('Royal Mail order response does not match');
 const tracking=typeof raw.trackingNumber==='string'&&/^[A-Za-z0-9-]{6,60}$/.test(raw.trackingNumber)?raw.trackingNumber:null;
 const shipped=typeof raw.shippedOn==='string'&&Number.isFinite(Date.parse(raw.shippedOn))&&Date.parse(raw.shippedOn)>Date.parse('2000-01-01')?raw.shippedOn:null;
 return {orderIdentifier:String(raw.orderIdentifier),reference,trackingNumber:tracking,shippedOn:shipped};
}
export function checkedRoyalMailCreation(raw,reference){
 if(raw?.successCount!==1||raw.errorsCount!==0||!Array.isArray(raw.createdOrders)||raw.createdOrders.length!==1||(raw.failedOrders??[]).length)throw Error('Royal Mail import is unresolved; check Click & Drop before any retry');
 return checkedRoyalMailOrder(raw.createdOrders[0],reference);
}
