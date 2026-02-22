import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CartItem = {
  slug: string;
  qty: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = body?.items as CartItem[];

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Fetch real products from DB (server-side validation)
    const slugs = items.map((i) => i.slug);

    const { data: products, error } = await supabase
      .from("products")
      .select("slug, stripe_price_id, is_active")
      .in("slug", slugs);

    if (error || !products) {
      return NextResponse.json(
        { error: "Product lookup failed" },
        { status: 500 }
      );
    }

    const line_items = items.map((item) => {
      const product = products.find((p) => p.slug === item.slug);

      if (!product || !product.is_active) {
        throw new Error("Invalid product in cart");
      }

      if (!product.stripe_price_id) {
        throw new Error(`Missing Stripe price ID for ${item.slug}`);
      }

      return {
        price: product.stripe_price_id,
        quantity: Math.max(1, item.qty),
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items,
      shipping_address_collection: { allowed_countries: ["GB"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "gbp" },
            display_name: "Free UK Shipping",
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,

      // ✅ Helps your webhook safely ignore non-Bling sessions (e.g., ReadDocs)
      client_reference_id: "bling-beauty",
      metadata: {
        app: "bling-beauty",
        source: "bling-beauty",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}