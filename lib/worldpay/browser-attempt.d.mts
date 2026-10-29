export type BrowserAttempt = {version:1;reference:string;ownershipSecret:string;checkoutId:string;submitted:boolean};
type Storage = {getItem(key:string):string|null;setItem(key:string,value:string):void};
export function readBrowserAttempt(storage:Storage,environment?:'try'|'live'):BrowserAttempt|null;
export function saveBrowserAttempt(storage:Storage,attempt:BrowserAttempt,environment?:'try'|'live'):BrowserAttempt;
export function markBrowserAttemptSubmitted(storage:Storage,reference:string,environment?:'try'|'live'):BrowserAttempt;

export function clearPaidBrowserAttempt(storage:Storage&{removeItem(key:string):void},reference:string,environment?:'try'|'live'):void;
