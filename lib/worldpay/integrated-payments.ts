/** Integrated Payments API transport, isolated from legacy Card Payments v7.
 * Preview/Try only. These functions must only be invoked behind an atomic order claim.
 * Never trust client-provided provider action links or order amounts.
 */
import 'server-only';
import { accessConfiguration } from './access-client';
import { API_VERSION, safeIntegratedAction, checkedProviderResult } from './integrated-payments-contract.mjs';

type ProviderResponse = { httpStatus: number; outcome: string; actions: Record<string,string>; data: Record<string, unknown>; correlationId: string | null };

async function request(method: 'POST'|'GET', href: string, payload?: object): Promise<ProviderResponse> {
  const { username, password } = accessConfiguration();
  const target = safeIntegratedAction(href);
  const response = await fetch(target, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      Accept: 'application/json',
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      'WP-Api-Version': API_VERSION,
    },
    ...(method === 'POST' ? { body: JSON.stringify(payload ?? {}) } : {}),
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  const raw: unknown = await response.json().catch(() => null);
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string,unknown> : {};
  const checked = checkedProviderResult(response.status, data);
  // Unknown errors and timeouts are uncertain, NEVER automatically retried.
  return { httpStatus: response.status, outcome: checked.outcome,
    actions: checked.actions, data, correlationId: response.headers.get('WP-CorrelationId') };
}

export async function createIntegratedPayment(serverValidatedPayload: object): Promise<ProviderResponse> {
  // Only a privileged coordinator may construct this payload from a claimed, server-priced order.
  return request('POST', 'https://try.access.worldpay.com/api/payments', serverValidatedPayload);
}
export async function advanceDeviceData(serverHeldAction: string, payload: object): Promise<ProviderResponse> {
  return request('POST', safeIntegratedAction(serverHeldAction,'device'), payload);
}
export async function advanceChallenge(serverHeldAction: string, payload: object): Promise<ProviderResponse> {
  return request('POST', safeIntegratedAction(serverHeldAction,'challenge'), payload);
}
export async function requestSettlement(serverHeldAction: string): Promise<ProviderResponse> {
  return request('POST', safeIntegratedAction(serverHeldAction,'settle'), {});
}
export async function queryIntegratedPayment(serverHeldLink: string): Promise<ProviderResponse> {
  return request('GET', safeIntegratedAction(serverHeldLink,'query'));
}
