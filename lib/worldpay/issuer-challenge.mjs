/** Pure validation of the issuer 3DS challenge display parameters.
 * These values must come from the authenticated Worldpay server response,
 * never from a client-supplied request.
 */
export function parseIssuerChallenge(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { url, jwt, reference } = value;
  if (typeof jwt !== 'string' || jwt.length < 16 || jwt.length > 16000 || !/^[A-Za-z0-9._-]+$/.test(jwt)) return null;
  if (typeof reference !== 'string' || reference.length < 1 || reference.length > 128 || !/^[\w-]+$/.test(reference)) return null;
  if (typeof url !== 'string' || url.length > 2048) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash || parsed.port || parsed.search ||
      !parsed.hostname.includes('.') || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(parsed.hostname)) return null;
  return { url: parsed.href, jwt, reference };
}
