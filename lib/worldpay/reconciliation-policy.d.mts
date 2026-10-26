export type QueryClassification = {state:'uncertain'|'pending'|'failed';reason:string;paymentId?:string;event?:string};
export function classifyPaymentQuery(body: unknown, expected: {reference:string;amountPence:number;entity:string}):QueryClassification;
export function canRecordSettledEvidence(result:QueryClassification,evidence:unknown):boolean;
