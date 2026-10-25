export type VerifiedPaymentState = 'paid' | 'pending' | 'failed' | 'uncertain';
export type Classification = { state: VerifiedPaymentState; paymentId: string | null };
export function classifyVerifiedPayment(args: {
  payment: unknown; expectedReference: string; expectedAmount: number; expectedEntity: string;
}): Classification;
export function classifyMatchingPayments(args: {
  payments: unknown; expectedReference: string; expectedAmount: number; expectedEntity: string;
}): Classification;
