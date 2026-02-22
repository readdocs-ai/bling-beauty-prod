import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

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

    // ✅ Only handle Bling sessions (so ReadDocs is untouched)
    const isBling =
      session.metadata?.app === "bling-beauty" ||
      session.client_reference_id === "bling-beauty";

    if (!isBling) return NextResponse.json({ ignored: true });

    await supabase.from("orders").upsert({
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      shipping_name: session.shipping_details?.name,
      shipping_address: session.shipping_details?.address,
      status: "paid",
    });
  }

  return NextResponse.json({ received: true });
}