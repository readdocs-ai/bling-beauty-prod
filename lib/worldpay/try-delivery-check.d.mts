export function tryDeliveryCheck(request:Request,config:{environment?:string;worldpayEnvironment?:string;enabled?:string},record?:(metadata:Record<string,unknown>)=>void):Promise<Response>;
