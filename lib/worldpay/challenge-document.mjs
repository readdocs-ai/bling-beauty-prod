/** Create an isolated, self-submitting challenge form INSIDE the iframe (Worldpay's documented pattern).
 * Never include challenge JWTs in query strings or server logs.
 */
export function buildChallengeDocument(challenge) {
  if (!challenge || typeof challenge.url !== 'string' || typeof challenge.jwt !== 'string') throw new Error('Invalid issuer challenge');
  const attr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"></head><body><p>Opening secure bank verification...</p><form id="issuer-challenge-form" method="POST" action="${attr(challenge.url)}"><input type="hidden" name="JWT" value="${attr(challenge.jwt)}"></form><script>document.getElementById('issuer-challenge-form').submit();<\/script></body></html>`;
}
