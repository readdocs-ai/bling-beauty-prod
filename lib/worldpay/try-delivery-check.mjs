// Diagnostic sink only. Never import payment, database or email code here.
const limit = 65536;
const knownTypes = new Set(['sentForAuthorization','authorized','sentForSettlement','settled',
  'settlementFailed','cancelled','error','expired','refused','sentForRefund','refunded','refundFailed','tokenCreated']);
const reply = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});

export async function tryDeliveryCheck(request,config,record=()=>{}) {
  if(config.environment!=='preview'||config.worldpayEnvironment!=='try'||config.enabled!=='true')
    return reply({error:'Unavailable'},404);
  if(request.method==='GET')return reply({mode:'try-delivery-check',paymentProcessing:false});
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  if(!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(request.headers.get('content-type')??''))
    return reply({error:'JSON required'},415);
  if(Number(request.headers.get('content-length')??0)>limit)return reply({error:'Body too large'},413);
  const reader=request.body?.getReader();
  if(!reader)return reply({error:'Invalid body'},400);
  const chunks=[];let size=0;
  try {
    for(;;){
      const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>limit){await reader.cancel();return reply({error:'Body too large'},413);}
      chunks.push(Buffer.from(value));
    }
    const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Invalid body'},400);
    // Only bounded, allowlisted metadata. No raw body, IDs, links, credentials,
    // customer/card details, signature values, or request URL enter logs.
    const type=body.eventDetails?.type;
    record({mode:'try-delivery-check',bytes:size,signaturePresent:request.headers.has('event-signature'),
      eventType:knownTypes.has(type)?type:'other',verified:false});
    return reply({received:true,verified:false,paymentProcessing:false});
  } catch {return reply({error:'Invalid body'},400);}
}
