export const API_VERSION: string;

export type WorldpayActionKind =
  | "any"
  | "query"
  | "device"
  | "challenge"
  | "settle";

export type WorldpayActions = {
  supply3dsDeviceData?: string;
  complete3dsChallenge?: string;
  settlePayment?: string;
  query?: string;
};

export function safeIntegratedAction(
  href: unknown,
  kind?: WorldpayActionKind
): string;

export function checkedProviderResult(
  status: number,
  raw: unknown
): {
  outcome: string;
  actions: WorldpayActions;
};

export function assertMatchingProviderPayment(
  provider: unknown,
  expected: {
    reference: string;
    amountPence: number;
  }
): boolean;
export function checkedProviderQueryResult(
  status: number,
  raw: unknown
): {
  outcome: string;
  actions: WorldpayActions;
};
