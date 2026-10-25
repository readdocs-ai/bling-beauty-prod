export interface PreviewClaimedOrder {
  reference: string;
  status: string;
  currency: string;
  amount_pence: number;
}
export function buildTryPaymentPayload(order: PreviewClaimedOrder, sessionHref: string, entity: string, narrative: string): {
  transactionReference: string;
  merchant: { entity: string };
  channel: 'ecom';
  instruction: { method: 'card'; paymentInstrument: { type: 'checkout'; sessionHref: string }; narrative: { line1: string }; value: { currency: 'GBP'; amount: number } };
};
