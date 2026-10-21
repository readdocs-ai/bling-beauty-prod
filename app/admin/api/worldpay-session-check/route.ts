import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const input = z.object({ sessionState: z.string().min(12).max(12000) }).strict();

// Admin access is enforced by middleware for all /admin routes.
// This endpoint deliberately does not authorise a payment or persist tokens.
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview" || process.env.WORLDPAY_ENVIRONMENT !== "try") {
    return NextResponse.json({ error: "Preview Try mode only" }, { status: 404, headers });
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let allowedOrigin = false;
  try { allowedOrigin = Boolean(origin && host && new URL(origin).host === host && new URL(origin).protocol === "https:"); } catch { /* reject malformed origin */ }
  if (!allowedOrigin) {
    return NextResponse.json({ error: "Origin check failed" }, { status: 403, headers });
  }
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 15000) return NextResponse.json({ error: "Invalid request" }, { status: 413, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers }); }
  const parsed = input.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid card-session format" }, { status: 400, headers });
  // Intentionally do not log, echo, save or forward the session token.
  return NextResponse.json({ accepted: true, paymentAuthorised: false, stage: "secure-session-handoff" }, { headers });
}
