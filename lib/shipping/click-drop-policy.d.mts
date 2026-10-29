export const TRADING_NAME:string;
export type Packing={weightGrams:number;taxPence:number;packageFormat:string};
export type RoyalMailResult={orderIdentifier:string;reference:string;trackingNumber:string|null;shippedOn:string|null};
export function royalMailReference(reference:string):string;
export function prepareRoyalMailDraft(order:any,packing:Packing):{items:any[]};
export function checkedRoyalMailOrder(raw:unknown,reference:string):RoyalMailResult;
export function checkedRoyalMailCreation(raw:unknown,reference:string):RoyalMailResult;
