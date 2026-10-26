/** Device-data form parameters must originate from a verified Worldpay response. */
export function parseDeviceData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { jwt, url, bin } = value;
  if (typeof jwt !== 'string' || jwt.length < 16 || jwt.length > 16000 || !/^[A-Za-z0-9._-]+$/.test(jwt)) return null;
  if (typeof url !== 'string' || url.length < 1 || url.length > 2048) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash || parsed.port ||
      parsed.hostname === 'localhost' || !parsed.hostname.includes('.') ||
      /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname) ||
      parsed.hostname.endsWith('.localhost') || parsed.hostname.endsWith('.local') ||
      parsed.hostname.endsWith('.internal')) return null;
  if (typeof bin !== 'string' || !/^[0-9]{6,8}$/.test(bin)) return null;
  return { url: parsed.href, jwt, bin };
}
