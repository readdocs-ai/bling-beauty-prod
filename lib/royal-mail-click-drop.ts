/** Server-only Click & Drop draft import. Never requests postage, labels or manifests. */
import 'server-only';
import {checkedRoyalMailCreation,checkedRoyalMailOrder,type RoyalMailResult} from './shipping/click-drop-policy.mjs';
export {prepareRoyalMailDraft as prepareClickDropOrder} from './shipping/click-drop-policy.mjs';
const BASE='https://api.parcel.royalmail.com/api/v1';
function key(){const value=process.env.ROYAL_MAIL_CLICK_DROP_API_KEY?.trim();if(!value)throw Error('Royal Mail API key is not configured');return value;}
export function clickDropConfigured(){return !!process.env.ROYAL_MAIL_CLICK_DROP_API_KEY?.trim();}
async function request(path:string,body?:unknown){
 const response=await fetch(BASE+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key()}`,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(response.status===404&&!body)return null;
 if(!response.ok)throw Error(`Royal Mail returned HTTP ${response.status}. Review Click & Drop before any retry.`);
 return response.json();
}
export async function checkClickDropConnection(){
 const result=await request('/carriers');
 if(!Array.isArray(result)||!result.length||result.some(c=>typeof c?.carrierName!=='string'||!c.carrierName.trim()))throw Error('Royal Mail returned no valid account carriers');
 return {connected:true,carriers:result.map(c=>c.carrierName)}; // No customer or other shop order data is read.
}
export async function prepareClickDropAccount(payload:{items:any[]}){
 const account=await checkClickDropConnection();
 const chosen=process.env.ROYAL_MAIL_CARRIER_NAME?.trim()||(account.carriers.length===1?account.carriers[0]:null);
 if(!chosen||!account.carriers.includes(chosen))throw Error('Choose the correct shared-account carrier in ROYAL_MAIL_CARRIER_NAME before importing');
 // Account-configured carrier name only; no postage service or label generation.
 payload.items[0].postageDetails={carrierName:chosen};
 await new Promise(resolve=>setTimeout(resolve,600));return payload;
}
export async function findClickDropOrder(reference:string):Promise<RoyalMailResult|null>{
 if(!/^BLING-[a-f0-9]{32}$/.test(reference))throw Error('Invalid Royal Mail reference');
 const result=await request(`/orders/${encodeURIComponent('"'+reference+'"')}`);
 if(result===null||Array.isArray(result)&&result.length===0)return null;
 if(!Array.isArray(result)||result.length!==1)throw Error('Royal Mail reference is ambiguous');
 return checkedRoyalMailOrder(result[0],reference);
}
export async function importClickDropOrder(payload:{items:any[]}):Promise<RoyalMailResult>{
 if(process.env.VERCEL_ENV!=='production'||process.env.BLING_ROYAL_MAIL_IMPORT_ENABLED!=='true')throw Error('Royal Mail imports are disabled');
 const item=payload.items[0];
 if(payload.items.length!==1||item?.sender?.tradingName!=='Bling Beauty Products'||item.label||!item.postageDetails||Object.keys(item.postageDetails).some(k=>k!=='carrierName')||typeof item.postageDetails.carrierName!=='string')throw Error('Invalid draft import');
 if(await findClickDropOrder(item.orderReference))throw Error('An order already exists in Click & Drop. Use Check existing import.');
 // Account rate limit is two calls/second; do not immediately POST after the lookup.
 await new Promise(resolve=>setTimeout(resolve,600));
 return checkedRoyalMailCreation(await request('/orders',payload),item.orderReference);
}
