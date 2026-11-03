type Attempt = {status:string;settlement_mode?:'manual'|'auto';provider_outcome:string;provider_continuation_claim:string|null;currency:string;amount_pence:number;payment_claim_id:string;provider_actions:Record<string,string>};
type Input = {reference:string;ownershipSecret:string};
type Claim = {action:string;captureClaim:string;paymentClaim:string};
export function matchesCaptureDetails(payment:unknown,expected:{reference:string;amountPence:number;entity:string;paymentId:string}):boolean;
export function captureOwnedAttempt(input:Input,gateways:{
  entity:string;
  readOwned(reference:string,secret:string):Promise<Attempt|null>;
  verify(reference:string,amount:number):Promise<{state:string;event?:string;paymentId?:string}>;
  details(paymentId:string):Promise<unknown>;
  claim(input:Input,attempt:Attempt,paymentId:string,action:string):Promise<Claim|null>;
  settle(action:{kind:'integrated'|'card-v7';href:string},paymentId:string):Promise<{httpStatus:number;data:Record<string,unknown>;correlationId:string|null}>;
  record(reference:string,claim:Claim,progress:{outcome:string;actions:Record<string,string>;correlationId:string|null}):Promise<boolean>;
}):Promise<{state:string}>;
