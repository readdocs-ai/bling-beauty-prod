export type SettledEvent={environment:'try'|'live';event_id:string;reference:string;amount_pence:number;event_timestamp:string;body_sha256:string;event_type?:'settled'|'sentForSettlement';authentication_method?:'hmac'|'worldpay_ip';provider_payment_id?:string;merchant_entity?:string;source_ip?:string};
export function verifyEventSignature(raw:Buffer,header:string|null,keys:Record<string,string>):boolean;
export function boundedEventBody(request:Request):Promise<Buffer>;
export function parseSettledEvent(raw:Buffer,environment:'try'|'live'):SettledEvent|null;
export function matchesSettledQuery(event:SettledEvent,attempt:any,query:any):boolean;
