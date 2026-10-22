import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const schema = z.object({ cardSession: z.string().url().min(12).max(12000), cvcSession: z.string().url().min(12).max(12000), confirmation: z.literal("AUTHORISE_TRY_100P") }).strict();

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
function isTryTokenHref(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "try.access.worldpay.com" &&
      url.pathname.startsWith("/tokens/") && !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}
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
    providerCode: safeProviderCode(data.code),
    providerName: safeProviderCode(data.name),
    // Field names only, never validation descriptions or rejected values.
    validationFields: Array.isArray(data.validationErrors)
      ? data.validationErrors.slice(0, 8).map(v => v && typeof v === "object" ? safeProviderCode((v as Record<string, unknown>).field) : undefined).filter(Boolean)
      : undefined,
    validationErrorCount: Array.isArray(data.validationErrors) ? data.validationErrors.length : undefined,
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
  if (!isTrySessionHref(parsed.data.cardSession) || !isTrySessionHref(parsed.data.cvcSession))
    return NextResponse.json({ error: "Invalid Try card session" }, { status: 400, headers });
  // Unique reference stays within Worldpay's documented 64-character limit.
  const reference = `BLING-TRY-${randomUUID()}`;
  const credentials = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  // Worldpay v7 card/checkout requires a verified token and a separate CVC session.
  // The card session is consumed only by Verified Tokens, never by Card Payments.
  try {
    const tokenResponse = await fetch("https://try.access.worldpay.com/verifiedTokens/oneTime", {
      method: "POST",
      headers: {
        Authorization: credentials,
        Accept: "application/vnd.worldpay.verified-tokens-v3.hal+json",
        "Content-Type": "application/vnd.worldpay.verified-tokens-v3.hal+json",
      },
      body: JSON.stringify({
        paymentInstrument: { type: "card/checkout", sessionHref: parsed.data.cardSession },
        merchant: { entity }, verificationCurrency: "GBP",
      }), cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const tokenCorrelation = tokenResponse.headers.get("WP-CorrelationId");
    const safeTokenCorrelation = tokenCorrelation && /^[a-zA-Z0-9-]{1,100}$/.test(tokenCorrelation) ? tokenCorrelation : undefined;
    const tokenData: unknown = await tokenResponse.json().catch(() => null);
    const tokenObject = tokenData && typeof tokenData === "object" ? tokenData as Record<string, unknown> : {};
    const embedded = tokenObject._embedded && typeof tokenObject._embedded === "object" ? tokenObject._embedded as Record<string, unknown> : {};
    const tokenResource = embedded.token && typeof embedded.token === "object" ? embedded.token as Record<string, unknown> : {};
    const links = tokenResource._links && typeof tokenResource._links === "object" ? tokenResource._links as Record<string, unknown> :
      tokenObject._links && typeof tokenObject._links === "object" ? tokenObject._links as Record<string, unknown> : {};
    const tokenLink = links["tokens:token"] && typeof links["tokens:token"] === "object" ? links["tokens:token"] as Record<string, unknown> : {};
    const tokenHref = typeof tokenLink.href === "string" ? tokenLink.href : "";
    if (!tokenResponse.ok || !isTryTokenHref(tokenHref) || (tokenObject.outcome !== "verified" && !(embedded.verification && typeof embedded.verification === "object" && (embedded.verification as Record<string, unknown>).outcome === "verified"))) {
      return NextResponse.json({ reference, stage: "verified-token", httpStatus: tokenResponse.status, correlationId: safeTokenCorrelation,
        ...safeProviderDiagnostics(tokenObject), authorized: false, captured: false, orderCreated: false,
        warning: "Verified token creation or response validation failed. No authorisation attempted. Do not reuse sessions. Share only status, safe error fields and correlation ID." },
        { status: 502, headers });
    }
    const body = {
    transactionReference: reference,
    channel: "ecom",
    merchant: { entity },
    instruction: {
      requestAutoSettlement: { enabled: false },
      narrative: { line1: "BLING BEAUTY" },
      value: { currency: "GBP", amount: 100 },
      paymentInstrument: { type: "card/checkout", tokenHref, cvcHref: parsed.data.cvcSession },
    },
  };
    const response = await fetch("https://try.access.worldpay.com/cardPayments/customerInitiatedTransactions", {
      method: "POST",
      headers: {
        Authorization: credentials,
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
      reference, stage: "card-authorisation", httpStatus: response.status, outcome, ...safeProviderDiagnostics(data),
      authorized: response.status === 201 && outcome.toLowerCase() === "authorized",
      captured: false, orderCreated: false,
      correlationId: correlation && /^[a-zA-Z0-9-]{1,100}$/.test(correlation) ? correlation : undefined,
      warning: "Try authorisation only. No settlement or order fulfilment. 3DS not yet integrated; do not use for live checkout. Do not retry an uncertain request with the same card session.",
    }, { status: response.ok ? 200 : 502, headers });
  } catch {
    return NextResponse.json({ reference, error: "Worldpay response unavailable; outcome uncertain. Do not retry this card session.", authorized: false }, { status: 502, headers });
  }
}
