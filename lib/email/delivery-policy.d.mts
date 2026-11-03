export function emailDeliverySettings(env:Record<string,string|undefined>,environment:string,recipients:string[]):{prefix:string};
export function emailIdempotencyKey(environment:string,orderId:string,kind:string):string;
