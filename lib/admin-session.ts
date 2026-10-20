/** Shared Edge-compatible signed admin session logic. No secrets are sent to clients. */
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]+$/.test(value) || value.length % 2) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function signingKey(): Promise<CryptoKey | null> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;
  // Domain-separated key material. Changing admin credentials invalidates all sessions.
  const material = encoder.encode(`bling-admin-session-v1\0${username}\0${password}`);
  const digest = await crypto.subtle.digest('SHA-256', material);
  return crypto.subtle.importKey('raw', digest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createAdminSession(): Promise<string> {
  const key = await signingKey();
  if (!key) throw new Error('Admin credentials are not configured');
  const issued = Math.floor(Date.now() / 1000);
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `v1.${issued}.${nonce}`;
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  return `${payload}.${toHex(signature)}`;
}

export async function verifyAdminSession(value: string): Promise<boolean> {
  if (!value || value.length > 256) return false;
  const match = /^v1\.(\d{10})\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return false;
  const issued = Number(match[1]);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(issued) || issued > now + 60 || now - issued > SESSION_SECONDS) return false;
  const key = await signingKey();
  const signature = fromHex(match[3]);
  if (!key || !signature) return false;
  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(`v1.${match[1]}.${match[2]}`));
}

export const ADMIN_SESSION_MAX_AGE = SESSION_SECONDS;
