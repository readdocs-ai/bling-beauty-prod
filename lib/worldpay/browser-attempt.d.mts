export type BrowserAttempt = {version:1;reference:string;ownershipSecret:string;checkoutId:string;submitted:boolean};
type Storage = {getItem(key:string):string|null;setItem(key:string,value:string):void};
export function readBrowserAttempt(storage:Storage):BrowserAttempt|null;
export function saveBrowserAttempt(storage:Storage,attempt:BrowserAttempt):BrowserAttempt;
export function markBrowserAttemptSubmitted(storage:Storage,reference:string):BrowserAttempt;
