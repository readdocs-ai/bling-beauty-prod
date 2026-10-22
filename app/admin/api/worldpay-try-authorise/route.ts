import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const schema = z.object({ sessionState: z.string().url().min(12).max(12000), confirmation: z.literal("AUTHORISE_TRY_100P") }).strict();

// Worldpay's one-time checkout session must originate from the Try host. Never log or return it.
function isTrySessionHref(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "try.access.worldpay.com" &&
      !url.username && !url.password && !url.hash && !url.search &&
      url.pathname.includes("/sessions/");
  } catch { return false; }
}

// Keep diagnostic values tightly allowlisted; upstream messages may contain customer/session data.
function safeProviderCode(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(value) ? value : undefined;
}
function safeProviderDiagnostics(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const data = value as Record<string, unknown>;
  return {
    errorName: safeProviderCode(data.errorName),
    errorCode: safeProviderCode(data.errorCode),
    // Worldpay may return the schema error under an `error` object.
    providerError: data.error && typeof data.error === "object" && !Array.isArray(data.error)
      ? safeProviderCode((data.error as Record<string, unknown>).errorName) : undefined,
    // Field names only, never validation descriptions or rejected values.
    validationFields: Array.isArray(data.validationErrors)
      ? data.validationErrors.slice(0, 8).map(v => v && typeof v === "object" ? safeProviderCode((v as Record<string, unknown>).field) : undefined).filter(Boolean)
      : undefined,
  };
}

/** Isolated £1.00 TRY authorisation only. No checkout/order writes, capture, or 3DS bypass claims. */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview" || process.env.WORLDPAY_ENVIRONMENT !== "try")
    return NextResponse.json({ error: "Preview Try only" }, { status: 404, headers });
  let origin: URL;
  try { origin = new URL(request.headers.get("origin") || ""); } catch { return NextResponse.json({ error: "Origin rejected" }, { status: 403, headers }); }
  const host = request.headers.get("host");
  if (!host || origin.protocol !== "https:" || origin.host !== host || request.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json({ error: "Origin rejected" }, { status: 403, headers });
  if (Number(request.headers.get("content-length") || 0) > 15000)
    return NextResponse.json({ error: "Request too large" }, { status: 413, headers });
  const user = process.env.WORLDPAY_API_USERNAME?.trim();
  const password = process.env.WORLDPAY_API_PASSWORD?.trim();
  const entity = process.env.WORLDPAY_ENTITY?.trim();
  if (!user || !password || !entity) return NextResponse.json({ error: "Try credentials missing" }, { status: 503, headers });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });
  if (!isTrySessionHref(parsed.data.sessionState))
    return NextResponse.json({ error: "Invalid Try card session" }, { status: 400, headers });
  // Unique reference stays within Worldpay's documented 64-character limit.
  const reference = `BLING-TRY-${randomUUID()}`;
  const body = {
    transactionReference: reference,
    channel: "ecom",
    merchant: { entity },
    instruction: {
      requestAutoSettlement: { enabled: false },
      narrative: { line1: "BLING BEAUTY" },
      value: { currency: "GBP", amount: 100 },
      paymentInstrument: { type: "card/checkout", sessionHref: parsed.data.sessionState },
    },
  };
  try {
    const response = await fetch("https://try.access.worldpay.com/cardPayments/customerInitiatedTransactions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
        Accept: "application/vnd.worldpay.payments-v7+json",
        "Content-Type": "application/vnd.worldpay.payments-v7+json",
      },
      body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    // Do not expose upstream body, card-session URLs, payment action links or credentials.
    const responseBody: unknown = await response.json().catch(() => null);
    const data = responseBody && typeof responseBody === "object" ? responseBody as Record<string, unknown> : {};
    const outcome = typeof data.outcome === "string" && /^[A-Za-z ]{1,40}$/.test(data.outcome) ? data.outcome : "unconfirmed";
    const correlation = response.headers.get("WP-CorrelationId");
    return NextResponse.json({
      reference, httpStatus: response.status, outcome, ...safeProviderDiagnostics(data),
      authorized: response.status === 201 && outcome.toLowerCase() === "authorized",
      captured: false, orderCreated: false,
      correlationId: correlation && /^[a-zA-Z0-9-]{1,100}$/.test(correlation) ? correlation : undefined,
      warning: "Try authorisation only. No settlement or order fulfilment. 3DS not yet integrated; do not use for live checkout. Do not retry an uncertain request with the same card session.",
    }, { status: response.ok ? 200 : 502, headers });
  } catch {
    return NextResponse.json({ reference, error: "Worldpay response unavailable; outcome uncertain. Do not retry this card session.", authorized: false }, { status: 502, headers });
  }
}
