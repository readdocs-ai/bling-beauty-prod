import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Temporary, read-only diagnostic. Middleware protects /admin routes.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Available only in Vercel Preview" }, { status: 404, headers });
  }
  const user = process.env.WORLDPAY_API_USERNAME?.trim();
  const password = process.env.WORLDPAY_API_PASSWORD?.trim();
  if (!user || !password) {
    return NextResponse.json({ error: "Worldpay Try credentials missing in Preview" }, { status: 503, headers });
  }
  try {
    const response = await fetch("https://try.access.worldpay.com/cardPayments", {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
        Accept: "application/vnd.worldpay.payments-v7+json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    // Only emit link relation names, not link URLs, tokens or upstream response bodies.
    let relations: string[] = [];
    if (response.ok) {
      const data: unknown = await response.json().catch(() => null);
      if (data && typeof data === "object" && "_links" in data) {
        const links = (data as { _links?: unknown })._links;
        if (links && typeof links === "object" && !Array.isArray(links)) {
          relations = Object.keys(links).filter(k => /^[a-zA-Z0-9:_-]{1,80}$/.test(k)).slice(0, 30);
        }
      }
    }
    return NextResponse.json({
      environment: "try",
      endpoint: "/cardPayments",
      method: "GET",
      upstreamStatus: response.status,
      authenticatedReadSucceeded: response.ok,
      paymentActionAdvertised: relations.some(k => k.startsWith("cardPayments:")),
      relationNames: relations,
      note: "Read-only discovery does not prove authorisation or live processing entitlement.",
    }, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Worldpay discovery request failed or timed out" }, { status: 502, headers });
  }
}
