import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // ✅ Only handle Bling sessions (aligns with your checkout metadata)
    const isBling =
      session.metadata?.source === "bling-beauty" ||
      session.metadata?.app === "bling-beauty" ||
      session.client_reference_id === "bling-beauty";

    if (!isBling) return NextResponse.json({ ignored: true });

    const { error } = await supabase.from("orders").upsert(
      {
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
        customer_email: session.customer_details?.email ?? null,
        shipping_name: session.shipping_details?.name ?? null,
        shipping_address: session.shipping_details?.address
          ? (session.shipping_details.address as any)
          : null,
        status: "paid",
      },
      { onConflict: "stripe_session_id" }
    );

    if (error) {
      console.error("orders upsert error:", error);
      return new NextResponse("Database error", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}