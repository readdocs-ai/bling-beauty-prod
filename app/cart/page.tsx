"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatGBP(n: number) {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

export default function CartPage() {
  const { items, subtotal, remove, setQty, clear } = useCart();

  async function goCheckout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (data?.url) window.location.href = data.url;
    else alert(data?.error ?? "Checkout error");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl md:text-4xl">Your cart</h1>
      <p className="mt-2 text-sm text-soft-black/70">Free shipping within the UK.</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-soft-black/10 bg-white/60 p-8 text-center shadow-soft">
          <div className="font-display text-2xl">Cart is empty</div>
          <p className="mt-2 text-sm text-soft-black/70">Browse the collection and add something you love.</p>
          <div className="mt-6"><ButtonLink href="/shop">Go shopping</ButtonLink></div>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-4">
            {items.map((it) => (
              <div key={it.slug} className="flex flex-col gap-4 rounded-2xl border border-soft-black/10 bg-white/60 p-5 shadow-soft sm:flex-row sm:items-center">
                <div className="relative h-24 w-full overflow-hidden rounded-2xl sm:h-24 sm:w-32">
                  {it.image ? <Image src={it.image} alt={it.name} fill className="object-cover" /> : <div className="grid h-full w-full place-items-center text-xs text-soft-black/60">No image</div>}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/product/${it.slug}`} className="font-display text-lg hover:underline">{it.name}</Link>
                      <div className="mt-1 text-sm text-soft-black/70">{formatGBP(it.price_gbp)}</div>
                    </div>

                    <Button variant="ghost" onClick={() => remove(it.slug)} className="px-3 py-2" aria-label={`Remove ${it.name}`}>Remove</Button>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-xs text-soft-black/60">Qty</label>
                    <Input type="number" min={1} value={it.qty} onChange={(e) => setQty(it.slug, Number(e.target.value))} className="w-24" />
                    <div className="ml-auto text-sm font-semibold">{formatGBP(it.price_gbp * it.qty)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Subtotal</div>
              <div className="text-sm font-semibold">{formatGBP(subtotal)}</div>
            </div>
            <div className="mt-2 text-xs text-soft-black/60">Free UK shipping.</div>

            <div className="mt-6 grid gap-3">
              <Button onClick={goCheckout} className="w-full justify-center">Pay with Stripe</Button>
              <ButtonLink href="/shop" variant="ghost" className="w-full justify-center">Continue shopping</ButtonLink>
              <Button variant="ghost" onClick={clear} className="w-full justify-center">Clear cart</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
