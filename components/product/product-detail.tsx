"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/product-types";
import { useCart } from "@/components/cart/cart-context";

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart(); // ✅ your context uses "add"

  const image = product.images?.[0] ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-soft-black/10 bg-white/60 shadow-soft">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-soft-black/60">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="font-display text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-soft-black/60">{product.category}</p>

          <div className="mt-6 text-2xl font-semibold">
            £{Number(product.price_gbp).toFixed(2)}
          </div>

          <p className="mt-6 text-soft-black/70">{product.description}</p>

          <div className="mt-8">
            <Button
              onClick={() =>
                add({
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price_gbp: Number(product.price_gbp),
                  stripe_price_id: product.stripe_price_id,
                  image,
                })
              }
              className="w-full md:w-auto"
            >
              Add to cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
