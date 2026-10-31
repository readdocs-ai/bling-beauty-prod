import type {SettledEvent} from './settlement-events.mjs';
export const WORLDPAY_WEBHOOK_IPS:readonly string[];
export function wpecomEventsConfigured(env:Record<string,string|undefined>):boolean;
export function trustedWorldpaySource(headers:Headers,env:Record<string,string|undefined>):string|null;
export function parseWpecomEvent(raw:Buffer,environment:string|undefined,sourceIp:string,expectedEntity:string):Omit<SettledEvent,'body_sha256'>|null;
export function matchesWpecomQuery(event:SettledEvent,attempt:any,query:any,expectedEntity:string):boolean;
