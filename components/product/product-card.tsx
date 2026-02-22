import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group overflow-hidden rounded-2xl border border-soft-black/10 bg-white/60 shadow-soft transition hover:-translate-y-1 hover:shadow-luxe"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {img ? (
          <Image src={img} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-soft-black/60">No image</div>
        )}
        {product.badge && (
          <div className="absolute left-4 top-4"><Badge>{product.badge}</Badge></div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-base">{product.name}</div>
            <div className="mt-1 text-xs text-soft-black/60">{product.category}</div>
          </div>
          <div className="text-sm font-semibold">£{Number(product.price_gbp).toFixed(2)}</div>
        </div>
        <p className="mt-3 text-sm text-soft-black/70">{product.short}</p>
        <div className="mt-5 text-sm font-medium text-soft-black/80 group-hover:text-soft-black">View details →</div>
      </div>
    </Link>
  );
}
