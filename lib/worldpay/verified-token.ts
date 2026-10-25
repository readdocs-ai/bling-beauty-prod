import 'server-only';
import { accessConfiguration, accessPost } from './access-client';
import { oneTimeVerifiedTokenPayload } from './verified-token-payload.mjs';

/** Server-only verified-token operation, not wired to public checkout.
 * Do not invoke until an idempotent pending-order transaction lock exists.
 * The returned object must not be serialized to a browser or logs.
 */
export async function createOneTimeVerifiedToken(cardSessionHref: string, cardHolderName: string) {
  const { entity } = accessConfiguration();
  const payload = oneTimeVerifiedTokenPayload({cardSessionHref, holderName: cardHolderName, merchantEntity: entity});
  return accessPost('verified-tokens-v3', '/verifiedTokens/oneTime', payload);
}
