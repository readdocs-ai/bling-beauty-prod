import { listProducts } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";

export default async function ShopPage() {
  const products = await listProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Shop</h1>
          <p className="mt-2 text-sm text-soft-black/70">Cosmetics + aesthetic enhancement essentials.</p>
        </div>
        <div className="flex gap-2">
          <Badge>Free UK shipping</Badge>
          <Badge>Secure Stripe checkout</Badge>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
