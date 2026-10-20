import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderingState } from "@/lib/order-switch";
import { luxuryItems } from "@/lib/luxury-catalogue";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  items: z.array(z.object({slug: z.string().min(1).max(150), quantity: z.number().int().min(1).max(10)}).strict()).min(1).max(20),
  customer: z.object({
    email: z.string().email().max(254),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(40).optional(),
  }).strict(),
  shipping: z.object({
    address1: z.string().trim().min(3).max(150),
    address2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(2).max(100),
    postcode: z.string().trim().min(3).max(16),
    country: z.literal("GB"),
  }).strict(),
}).strict();

/** Validate checkout inputs and server-side product prices. Does not store PII, create orders or initiate payment. */
export async function POST(request: Request) {
  try {
    const ordering = await getOrderingState();
    if (!ordering.configured || ordering.suspended) return NextResponse.json({error: "New orders are suspended."}, {status: 503, headers: {"Cache-Control": "no-store"}});
    const parsed = RequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({error: "Please check your basket and delivery details."}, {status: 400, headers: {"Cache-Control": "no-store"}});
    const catalogue = new Map(luxuryItems.map(item => [item.slug, item]));
    const quantities = new Map<string, number>();
    for (const item of parsed.data.items) {
      if (!catalogue.has(item.slug)) return NextResponse.json({error: "A product is unavailable."}, {status: 400});
      const quantity = (quantities.get(item.slug) ?? 0) + item.quantity;
      if (quantity > 10) return NextResponse.json({error: "Quantity limit exceeded."}, {status: 400});
      quantities.set(item.slug, quantity);
    }
    const lines = [...quantities].map(([slug, quantity]) => {
      const item = catalogue.get(slug)!;
      const unitPence = Math.round(item.sellingPrice * 100);
      return {slug, name: item.name, quantity, unitPence, lineTotalPence: unitPence * quantity};
    });
    const subtotalPence = lines.reduce((total, line) => total + line.lineTotalPence, 0);
    return NextResponse.json({valid: true, currency: "GBP", lines, subtotalPence, shippingPence: 0, totalPence: subtotalPence, paymentEnabled: false, message: "Checkout validation complete. Free UK delivery; payment is not yet enabled."}, {headers: {"Cache-Control": "no-store"}});
  } catch {
    return NextResponse.json({error: "Checkout validation is temporarily unavailable."}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }
}
