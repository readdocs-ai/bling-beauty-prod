import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getOrderingState } from "@/lib/order-switch";
import { luxuryItems } from "@/lib/luxury-catalogue";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const schema = z.object({
  items: z.array(z.object({ slug: z.string().min(1).max(150), quantity: z.number().int().min(1).max(10) }).strict()).min(1).max(20),
  customer: z.object({ name: z.string().trim().min(2).max(120), email: z.string().email().max(254), phone: z.string().max(40).optional() }).strict(),
  shipping: z.object({ address1: z.string().trim().min(3).max(150), address2: z.string().max(150).optional(), city: z.string().trim().min(2).max(100), postcode: z.string().trim().min(3).max(16), country: z.literal("GB") }).strict(),
}).strict();
const noStore = { "Cache-Control": "no-store" };

// Only redirect customers to a Worldpay-owned HTTPS payment page.
function trustedWorldpayRedirect(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (url.hostname !== "worldpay.com" && !url.hostname.endsWith(".worldpay.com")) return null;
    return url.toString();
  } catch { return null; }
}

function linkHref(value: unknown): unknown {
  if (!value || typeof value !== "object") return null;
  return (value as Record<string, unknown>).href;
}

// Diagnostic metadata only: never print a full session URL, query values, or
// transaction identifiers embedded in the Worldpay path.
function redirectCandidateDiagnostic(raw: unknown) {
  const validUrl = trustedWorldpayRedirect(raw);
  if (!validUrl) return { present: typeof raw === "string", trusted: false };
  const parsed = new URL(validUrl);
  return {
    present: true,
    trusted: true,
    host: parsed.hostname,
    pathSegments: parsed.pathname.split("/").filter(Boolean).length,
    queryKeys: [...new Set(parsed.searchParams.keys())].sort().slice(0, 12),
  };
}

export async function POST(request: Request) {
  try {
    const state = await getOrderingState();
    if (!state.configured || state.suspended) return NextResponse.json({ error: "Orders are temporarily unavailable." }, { status: 503, headers: noStore });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check your basket and delivery details." }, { status: 400, headers: noStore });
    const user = process.env.WORLDPAY_API_USERNAME?.trim();
    const password = process.env.WORLDPAY_API_PASSWORD?.trim();
    const entity = process.env.WORLDPAY_ENTITY?.trim();
    if (!user || !password || !entity) return NextResponse.json({ error: "Payment provider setup is incomplete. Please try later." }, { status: 503, headers: noStore });
    const catalogue = new Map(luxuryItems.map(item => [item.slug, item]));
    const quantities = new Map<string, number>();
    for (const item of parsed.data.items) {
      if (!catalogue.has(item.slug)) return NextResponse.json({ error: "A product is unavailable." }, { status: 400, headers: noStore });
      const qty = (quantities.get(item.slug) ?? 0) + item.quantity;
      if (qty > 10) return NextResponse.json({ error: "Maximum 10 per product." }, { status: 400, headers: noStore });
      quantities.set(item.slug, qty);
    }
    const lines = [...quantities].map(([slug, quantity]) => {
      const item = catalogue.get(slug)!;
      const unitPence = Math.round(item.sellingPrice * 100);
      return { slug, name: item.name, quantity, unitPence, lineTotalPence: unitPence * quantity };
    });
    const amount = lines.reduce((sum, line) => sum + line.lineTotalPence, 0);
    if (amount < 1 || amount > 1000000) return NextResponse.json({ error: "Invalid order amount." }, { status: 400, headers: noStore });
    const reference = `BLING-${randomUUID()}`;
    // Persist pending checkout before redirect. No customer details are sent in browser URL.
    const { error: insertError } = await supabaseAdmin.from("bling_checkout_attempts").insert({
      reference, status: "pending", amount_pence: amount, currency: "GBP", items: lines,
      customer: parsed.data.customer, shipping: parsed.data.shipping,
    });
    if (insertError) {
      console.error("Checkout persistence failed", insertError.code);
      return NextResponse.json({ error: "Unable to create order. Please try later." }, { status: 503, headers: noStore });
    }
    // Fail closed: a missing or misspelled environment must never silently
    // select the wrong merchant endpoint after ordering is enabled.
    const worldpayEnvironment = process.env.WORLDPAY_ENVIRONMENT;
    if (worldpayEnvironment !== "live" && worldpayEnvironment !== "try") {
      await supabaseAdmin.from("bling_checkout_attempts").update({ status: "setup_failed" }).eq("reference", reference);
      return NextResponse.json({ error: "Payment provider environment is not configured." }, { status: 503, headers: noStore });
    }
    if (process.env.VERCEL_ENV === "production" && worldpayEnvironment !== "live") {
      await supabaseAdmin.from("bling_checkout_attempts").update({ status: "setup_failed" }).eq("reference", reference);
      return NextResponse.json({ error: "Payments are not configured for live orders." }, { status: 503, headers: noStore });
    }
    const isLive = worldpayEnvironment === "live";
    const endpoint = isLive ? "https://access.worldpay.com/payment_pages" : "https://try.access.worldpay.com/payment_pages";
    // Never derive customer-facing return URLs from the incoming Host header.
    // An explicitly configured HTTPS public origin is required in production.
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
    if (!configuredOrigin) {
      return NextResponse.json({ error: "Payment return URL is not configured." }, { status: 503, headers: noStore });
    }
    let origin: string;
    try {
      const publicUrl = new URL(configuredOrigin);
      if (publicUrl.protocol !== "https:" || publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash) throw new Error("Invalid public origin");
      origin = publicUrl.origin;
    } catch {
      return NextResponse.json({ error: "Payment return URL is invalid." }, { status: 503, headers: noStore });
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
        Accept: "application/vnd.worldpay.payment_pages-v1.hal+json",
        "Content-Type": "application/vnd.worldpay.payment_pages-v1.hal+json",
      },
      body: JSON.stringify({
        transactionReference: reference,
        merchant: { entity }, narrative: { line1: "Bling Beauty Products" },
        value: { currency: "GBP", amount },
        resultURLs: { successURL: `${origin}/success?reference=${encodeURIComponent(reference)}`, failureURL: `${origin}/cart`, cancelURL: `${origin}/cart`, errorURL: `${origin}/cart` },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const result: unknown = await response.json().catch(() => null);
    const data = result && typeof result === "object" ? result as Record<string, unknown> : {};
    const links = data._links && typeof data._links === "object" ? data._links as Record<string, unknown> : {};
    const url = trustedWorldpayRedirect(data.url)
      ?? trustedWorldpayRedirect(linkHref(links.redirect))
      ?? trustedWorldpayRedirect(linkHref(links.paymentPage));
    if (!response.ok || !url) {
      await supabaseAdmin.from("bling_checkout_attempts").update({ status: "setup_failed" }).eq("reference", reference);
      // Log only allowlisted, non-sensitive diagnostic metadata. Never log credentials,
      // the full provider response, or customer data. Use these IDs with Worldpay support.
      const providerError = typeof data.errorName === "string" ? data.errorName.slice(0, 80)
        : typeof data.error === "string" ? data.error.slice(0, 80) : "unknown";
      const providerRequestId = response.headers.get("wp-correlationid")
        ?? response.headers.get("x-correlation-id")
        ?? response.headers.get("x-request-id");
      console.error("Worldpay HPP setup failed", {
        httpStatus: response.status,
        errorType: providerError,
        requestId: providerRequestId?.slice(0, 100) ?? "unavailable",
        environment: isLive ? "live" : "try",
        reference,
      });
      return NextResponse.json({ error: "Secure payment could not start. Please try again." }, { status: 502, headers: noStore });
    }
    // A successful setup response does not guarantee Worldpay will accept the browser session.
    // Compare candidate URLs without logging session-bearing URLs or query values.
    const candidates = {
      url: trustedWorldpayRedirect(data.url),
      redirect: trustedWorldpayRedirect(linkHref(links.redirect)),
      paymentPage: trustedWorldpayRedirect(linkHref(links.paymentPage)),
    };
    const trustedCandidates = Object.values(candidates).filter((value): value is string => Boolean(value));
    console.info("Worldpay HPP setup accepted", {
      environment: isLive ? "live" : "try",
      redirectSource: candidates.url ? "url" : candidates.redirect ? "links.redirect" : "links.paymentPage",
      candidateCount: trustedCandidates.length,
      candidatesIdentical: trustedCandidates.every(candidate => candidate === url),
      candidates: {
        url: redirectCandidateDiagnostic(data.url),
        redirect: redirectCandidateDiagnostic(linkHref(links.redirect)),
        paymentPage: redirectCandidateDiagnostic(linkHref(links.paymentPage)),
      },
      linkRelations: Object.keys(links).filter(key => ["self", "redirect", "paymentPage"].includes(key)),
      reference,
    });
    const self = links.self && typeof links.self === "object" ? links.self as Record<string, unknown> : {};
    const { error: updateError } = await supabaseAdmin.from("bling_checkout_attempts")
      .update({ status: "redirected", query_url: typeof self.href === "string" ? self.href : null })
      .eq("reference", reference);
    if (updateError) {
      console.error("Checkout state update failed", updateError.code);
      return NextResponse.json({ error: "Unable to confirm checkout setup. Please try later." }, { status: 503, headers: noStore });
    }
    return NextResponse.json({ redirectUrl: url }, { headers: noStore });
  } catch (error) {
    console.error("Checkout initiation error", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503, headers: noStore });
  }
}
