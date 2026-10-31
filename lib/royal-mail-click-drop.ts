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
 if(!response.ok){
  // Only bounded machine codes reach admin; never return raw provider bodies or credentials.
  const problem:unknown=await response.json().catch(()=>null);
  const codes=(Array.isArray(problem)?problem:[problem]).flatMap((p:any)=>typeof p?.code==='string'&&/^[A-Za-z0-9_.-]{1,80}$/.test(p.code)?[p.code]:[]).slice(0,5);
  throw Object.assign(Error(`Royal Mail returned HTTP ${response.status}${codes.length?` (${codes.join(', ')})`:''}. Review Click & Drop before any retry.`),{providerStatus:response.status});
 }
 return response.json();
}
export async function checkClickDropConnection(){
 const result=await request('/carriers');
 if(!Array.isArray(result)||result.some(c=>typeof c?.carrierName!=='string'||!c.carrierName.trim()))throw Error('Royal Mail returned an unexpected carrier response. No orders were created.');
 return {connected:true,carriers:result.map(c=>c.carrierName)}; // No customer or other shop order data is read.
}
export async function prepareClickDropAccount(payload:{items:any[]}){
 const account=await checkClickDropConnection();
 const configured=process.env.ROYAL_MAIL_CARRIER_NAME?.trim();
 const chosen=configured||(account.carriers.length===1?account.carriers[0]:undefined);
 if((configured&&!account.carriers.includes(configured))||(!chosen&&account.carriers.length>1))throw Error('Choose the correct shared-account carrier in ROYAL_MAIL_CARRIER_NAME before importing');
 // Carrier selection is required for multi-carrier accounts only. An empty list
 // uses the provider default for the draft, without inventing a carrier or service.
 if(chosen)payload.items[0].postageDetails={carrierName:chosen};
 else delete payload.items[0].postageDetails;
 await new Promise(resolve=>setTimeout(resolve,600));return payload;
}
export async function findClickDropOrder(reference:string):Promise<RoyalMailResult|null>{
 if(!/^BLING-[a-f0-9]{32}$/.test(reference))throw Error('Invalid Royal Mail reference');
 let result;
 try{result=await request(`/orders/${encodeURIComponent('"'+reference+'"')}`);}
 catch(error){
  if(!error||typeof error!=='object'||!('providerStatus' in error)||error.providerStatus!==400)throw error;
  // Some accounts reject the quoted-reference endpoint. The documented paged
  // GET is a read-only fallback. Absence is conclusive only after ALL pages.
  let token:string|undefined;const matches:any[]=[];const seen=new Set<string>();
  for(let page=0;page<5;page++){
   await new Promise(resolve=>setTimeout(resolve,600));
   const batch=await request('/orders?pageSize=100'+(token?'&continuationToken='+encodeURIComponent(token):''));
   if(!batch||!Array.isArray(batch.orders))throw Error('Royal Mail order lookup is incomplete; do not create another draft');
   matches.push(...batch.orders.filter((o:any)=>o?.orderReference===reference));
   if(matches.length>1)throw Error('Royal Mail reference is ambiguous');
   const next=batch.continuationToken;
   if(next===null||next===undefined||next==='')return matches.length?checkedRoyalMailOrder(matches[0],reference):null;
   if(typeof next!=='string'||next.length>4096||seen.has(next))throw Error('Royal Mail order lookup is incomplete; do not create another draft');
   seen.add(next);token=next;
  }
  throw Error('Royal Mail order lookup is incomplete; do not create another draft');
 }
 if(result===null||Array.isArray(result)&&result.length===0)return null;
 if(!Array.isArray(result)||result.length!==1)throw Error('Royal Mail reference is ambiguous');
 return checkedRoyalMailOrder(result[0],reference);
}
export async function importClickDropOrder(payload:{items:any[]}):Promise<RoyalMailResult>{
 if(process.env.VERCEL_ENV!=='production'||process.env.BLING_ROYAL_MAIL_IMPORT_ENABLED!=='true')throw Error('Royal Mail imports are disabled');
 const item=payload.items[0];
 if(payload.items.length!==1||item?.sender?.tradingName!=='Bling Beauty Products'||item.label||(item.postageDetails!==undefined&&(!item.postageDetails||Object.keys(item.postageDetails).some(k=>k!=='carrierName')||typeof item.postageDetails.carrierName!=='string'||!item.postageDetails.carrierName.trim())))throw Error('Invalid draft import');
 if(await findClickDropOrder(item.orderReference))throw Error('An order already exists in Click & Drop. Use Check existing import.');
 // Account rate limit is two calls/second; do not immediately POST after the lookup.
 await new Promise(resolve=>setTimeout(resolve,600));
 return checkedRoyalMailCreation(await request('/orders',payload),item.orderReference);
}
