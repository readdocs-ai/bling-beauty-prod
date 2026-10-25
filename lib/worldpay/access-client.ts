/** Worldpay Access API transport. Server-side only. No card PAN or CVC accepted. */
import "server-only";

export type AccessService = "payments-v7" | "3ds-v3" | "verified-tokens-v3";
const mediaTypes: Record<AccessService, string> = {
  "payments-v7": "application/vnd.worldpay.payments-v7+json",
  "3ds-v3": "application/vnd.worldpay.verifications.customers-v3.hal+json",
  "verified-tokens-v3": "application/vnd.worldpay.verified-tokens-v3.hal+json",
};
export type AccessResult = { status: number; outcome: string | null; data: Record<string, unknown>; correlationId: string | null };

export function accessConfiguration() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.WORLDPAY_ENVIRONMENT !== "try") {
    throw new Error("Worldpay Access operations are restricted to Try on Vercel Preview");
  }
  const username = process.env.WORLDPAY_API_USERNAME?.trim();
  const password = process.env.WORLDPAY_API_PASSWORD?.trim();
  const entity = process.env.WORLDPAY_ENTITY?.trim();
  if (!username || !password || !entity) throw new Error("Worldpay Try credentials incomplete");
  return { username, password, entity, origin: "https://try.access.worldpay.com" } as const;
}

/** Never accept arbitrary URLs supplied by the browser; links are server-held only. */
export function safeWorldpayLink(link: unknown): string {
  if (typeof link !== "string") throw new Error("Missing Worldpay action link");
  const parsed = new URL(link);
  if (parsed.origin !== "https://try.access.worldpay.com" || parsed.username || parsed.password || parsed.hash ||
    !/^\/(api\/payments|payments|verifications|verifiedTokens)(\/|$)/.test(parsed.pathname)) {
    throw new Error("Worldpay action link rejected");
  }
  return parsed.href;
}

export async function accessPost(service: AccessService, pathOrLink: string, payload: object): Promise<AccessResult> {
  const config = accessConfiguration();
  const url = safeWorldpayLink(new URL(pathOrLink, config.origin).href);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
      Accept: mediaTypes[service],
      "Content-Type": mediaTypes[service],
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const json: unknown = await response.json().catch(() => null);
  const data = json && typeof json === "object" && !Array.isArray(json) ? json as Record<string, unknown> : {};
  return {
    status: response.status,
    outcome: typeof data.outcome === "string" ? data.outcome : null,
    data,
    correlationId: response.headers.get("WP-CorrelationId"),
  };
}

export function verifiedPaymentOutcome(result: AccessResult): "authorised" | "settlement_requested" | "declined" | "uncertain" {
  if (result.status === 201 && result.outcome?.toLowerCase() === "authorized") return "authorised";
  if (result.status === 201 && result.outcome?.toLowerCase() === "sent for settlement") return "settlement_requested";
  if (result.status === 201 && result.outcome?.toLowerCase() === "refused") return "declined";
  return "uncertain";
}
