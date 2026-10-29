/** Integrated Payments API transport, isolated from legacy Card Payments v7.
 * Explicit Try/Preview or Live/Production only. These functions must only be invoked behind an atomic order claim.
 * Never trust client-provided provider action links or order amounts.
 */
import 'server-only';
import { accessConfiguration } from './access-client';
import {assertLiveRuntime} from './live-policy.mjs';
import { API_VERSION, safeIntegratedAction, checkedProviderResult, checkedProviderQueryResult } from './integrated-payments-contract.mjs';

type ProviderResponse = { httpStatus: number; outcome: string; actions: Record<string,string>; data: Record<string, unknown>; correlationId: string | null };

async function request(method: 'POST'|'GET', href: string, payload?: object, environment:'try'|'live'='try'): Promise<ProviderResponse> {
  const { username, password } = environment==='live'?assertLiveRuntime(process.env):accessConfiguration();
  const target = safeIntegratedAction(href,'any',environment);
  const response = await fetch(target, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      Accept: 'application/json',
      ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
      'WP-Api-Version': API_VERSION,
    },
    ...(method === 'POST' && payload !== undefined ? { body: JSON.stringify(payload) } : {}),
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  const raw: unknown = await response.json().catch(() => null);
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string,unknown> : {};
  const checked = method === 'GET' ? checkedProviderQueryResult(response.status, data, environment) : checkedProviderResult(response.status, data, environment);
  // Unknown errors and timeouts are uncertain, NEVER automatically retried.
  return { httpStatus: response.status, outcome: checked.outcome,
    actions: checked.actions, data, correlationId: response.headers.get('WP-CorrelationId') };
}

export async function createIntegratedPayment(serverValidatedPayload: object, environment:'try'|'live'='try'): Promise<ProviderResponse> {
  // Only a privileged coordinator may construct this payload from a claimed, server-priced order.
  return request('POST', environment==='live'?'https://access.worldpay.com/api/payments':'https://try.access.worldpay.com/api/payments', serverValidatedPayload, environment);
}
export async function advanceDeviceData(serverHeldAction: string, payload: object, environment:'try'|'live'='try'): Promise<ProviderResponse> {
  return request('POST', safeIntegratedAction(serverHeldAction,'device',environment), payload, environment);
}
export async function advanceChallenge(serverHeldAction: string, environment:'try'|'live'='try'): Promise<ProviderResponse> {
  return request('POST', safeIntegratedAction(serverHeldAction,'challenge',environment), undefined, environment);
}
export async function requestSettlement(serverHeldAction: string, environment:'try'|'live'='try'): Promise<ProviderResponse> {
  return request('POST', safeIntegratedAction(serverHeldAction,'settle',environment), undefined, environment);
}
export async function queryIntegratedPayment(serverHeldLink: string): Promise<ProviderResponse> {
  return request('GET', safeIntegratedAction(serverHeldLink,'query'));
}
