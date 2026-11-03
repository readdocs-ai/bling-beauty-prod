export type SettledEvent={environment:'try'|'live';event_id:string;reference:string;amount_pence:number;event_timestamp:string;body_sha256:string};
export function verifyEventSignature(raw:Buffer,header:string|null,keys:Record<string,string>):boolean;
export function boundedEventBody(request:Request):Promise<Buffer>;
export function parseSettledEvent(raw:Buffer,environment:'try'|'live'):SettledEvent|null;
export function matchesSettledQuery(event:SettledEvent,attempt:any,query:any):boolean;
