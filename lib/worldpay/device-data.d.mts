export function parseDeviceData(value: unknown): { url: string; jwt: string; bin: string } | null;
export function deviceDataOrigin(environment?:'try'|'live'):string;
export function parseEnvironmentDeviceData(value:unknown,environment?:'try'|'live'):{url:string;jwt:string;bin:string}|null;
export function deviceDataCompletion(data:unknown,origin:string,environment:'try'|'live',expectedFrame:boolean):string|null;
