export interface PreviewClaimedOrder {
  reference: string;
  status: string;
  currency: string;
  amount_pence: number;
  settlement_mode?: 'manual'|'auto';
}
export function buildTryPaymentPayload(order: PreviewClaimedOrder, sessionHref: string, entity: string, narrative: string, threeDS: { returnUrl: string; userAgent: string; language: string; width: number; height: number; timeZone: number }): {
  transactionReference: string;
  merchant: { entity: string };
  channel: 'ecom';
  instruction: { method: 'card'; settlement?:{auto:true}; threeDS: object; paymentInstrument: { type: 'checkout'; sessionHref: string }; narrative: { line1: string }; value: { currency: 'GBP'; amount: number } };
};

export function buildIntegratedPaymentPayload(order:PreviewClaimedOrder,sessionHref:string,entity:string,narrative:string,threeDS:Parameters<typeof buildTryPaymentPayload>[4],environment?:'try'|'live'):ReturnType<typeof buildTryPaymentPayload>;
