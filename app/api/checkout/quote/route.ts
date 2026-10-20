import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderingState } from "@/lib/order-switch";
import { luxuryItems } from "@/lib/luxury-catalogue";

export const dynamic = "force-dynamic";

const QuoteRequest = z.object({
  items: z.array(z.object({
    slug: z.string().min(1).max(150),
    quantity: z.number().int().min(1).max(10),
  }).strict()).min(1).max(20),
}).strict();

/** Server-authoritative basket quotation. This does not create an order or take payment. */
export async function POST(request: Request) {
  try {
    const state = await getOrderingState();
    if (!state.configured || state.suspended) {
      return NextResponse.json({ error: "New orders are currently suspended." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    const raw = await request.json();
    const parsed = QuoteRequest.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid basket." }, { status: 400 });
    const products = new Map(luxuryItems.map((item) => [item.slug, item]));
    const quantities = new Map<string, number>();
    for (const item of parsed.data.items) {
      if (!products.has(item.slug)) return NextResponse.json({ error: "Product unavailable." }, { status: 400 });
      const next = (quantities.get(item.slug) ?? 0) + item.quantity;
      if (next > 10) return NextResponse.json({ error: "Quantity limit exceeded." }, { status: 400 });
      quantities.set(item.slug, next);
    }
    const lines = [...quantities].map(([slug, quantity]) => {
      const product = products.get(slug)!;
      const unitPence = Math.round(product.sellingPrice * 100);
      return { slug, name: product.name, quantity, unitPence, lineTotalPence: unitPence * quantity };
    });
    const subtotalPence = lines.reduce((total, line) => total + line.lineTotalPence, 0);
    return NextResponse.json({ currency: "GBP", lines, subtotalPence, shippingPence: 0, totalPence: subtotalPence, paymentEnabled: false, note: "Quotation only. Free UK delivery; payments are not available yet." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to calculate basket." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
