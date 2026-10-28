type Diagnostic = {format:string;bytes?:number;knownFields?:string[];fieldCount?:number;transactionIdLength?:number|null};
export function readIssuerReturn(request:Request):Promise<
  {ok:true;id:string;diagnostic:Diagnostic}|{ok:false;reason:string;status:number;diagnostic:Diagnostic}
>;
