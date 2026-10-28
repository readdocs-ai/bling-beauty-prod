import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
/** Authenticate exact bytes before parsing; key IDs permit overlapping rotation keys. */
export function verifyEventSignature(raw,header,keys){
 if(!Buffer.isBuffer(raw)||raw.length>65536||typeof header!=='string'||header.length>4096||!keys)return false;
 for(const token of header.split(',').slice(0,8)){
  const match=/^([0-9]{1,10})\/SHA256\/(.+)$/.exec(token.trim());
  if(!match||typeof keys[match[1]]!=='string'||!keys[match[1]])continue;
  const value=match[2];let received;
  if(/^[a-fA-F0-9]{64}$/.test(value))received=Buffer.from(value,'hex');
  else if(/^[A-Za-z0-9+/]{43}=$/.test(value))received=Buffer.from(value,'base64');
  else continue;
  const expected=createHmac('sha256',keys[match[1]]).update(raw).digest();
  if(received.length===expected.length&&timingSafeEqual(received,expected))return true;
 }
 return false;
}
export async function boundedEventBody(request){
 if(Number(request.headers.get('content-length')||0)>65536)throw Error('Body too large');
 const reader=request.body?.getReader();if(!reader)throw Error('Empty body');
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
  if(size>65536){await reader.cancel();throw Error('Body too large');}chunks.push(Buffer.from(value));}
 return Buffer.concat(chunks);
}
export function parseSettledEvent(raw,environment){
 if(!['try','live'].includes(environment))throw Error('Invalid environment');
 const body=JSON.parse(raw.toString('utf8')),d=body?.eventDetails;
 if(!body||typeof body.eventId!=='string'||!/^[-A-Za-z0-9_]{3,128}$/.test(body.eventId)||
  typeof body.eventTimestamp!=='string'||body.eventTimestamp.length>64||!Number.isFinite(Date.parse(body.eventTimestamp)))throw Error('Invalid event');
 if(d?.classification!=='payment'||d.type!=='settled')return null;
 if(!/^BLING-[0-9a-f-]{36}$/.test(d.transactionReference??'')||d.amount?.currencyCode!=='GBP'||
  !Number.isSafeInteger(d.amount?.value)||d.amount.value<1)throw Error('Invalid settlement');
 return {environment,event_id:body.eventId,reference:d.transactionReference,amount_pence:d.amount.value,
  event_timestamp:body.eventTimestamp,body_sha256:createHash('sha256').update(raw).digest('hex')};
}
export function matchesSettledQuery(event,attempt,query){
 return attempt?.payment_environment===event.environment&&attempt.currency==='GBP'&&
  attempt.amount_pence===event.amount_pence&&attempt.reference===event.reference&&
  typeof attempt.payment_claim_id==='string'&&/^[A-Za-z0-9_-]{3,128}$/.test(query?.paymentId??'')&&
  (query.paymentId===attempt.provider_payment_id||
   (attempt.settlement_mode==='auto'&&attempt.provider_payment_id===null))&&query.state==='pending'&&
  ['settlementrequestsubmitted','settlementrequested','sentforsettlement','settled','capturesucceeded','salesucceeded'].includes(query.event);
}
