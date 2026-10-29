export const LIVE_ORIGINS:string[];
export function liveOrigin(env:Record<string,string|undefined>):string;
export function liveReturnUrl(url:string,env:Record<string,string|undefined>):string;
export function signingKeysConfigured(raw:string|undefined):boolean;
export function liveReadiness(env:Record<string,string|undefined>):{ready:boolean;checks:Record<string,boolean>};
export function assertLiveRuntime(env:Record<string,string|undefined>):{username:string;password:string;entity:string;origin:string};
