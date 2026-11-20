export function emailDeliverySettings(env:Record<string,string|undefined>,environment:string,recipients:string[],provider?:'worldpay'|'paypal'):{prefix:string};
export function emailIdempotencyKey(environment:string,orderId:string,kind:string):string;
