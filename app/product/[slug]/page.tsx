import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { AddToCartButton } from "@/components/product/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ProductGallery } from "@/components/product/gallery";

const fallbackImages: string[] = [];

function slugify(input?: string | null) {
  const value = (input ?? "").toString();
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default async function ProductPage({ params }: { params: { slug?: string } }) {
  const raw = params?.slug ?? "";
  if (!raw) return notFound();

  const normalized = slugify(raw);
  const product = (await getProductBySlug(raw)) || (await getProductBySlug(normalized));
  if (!product) return notFound();

  const images = product.images?.filter(Boolean).length ? product.images.filter(Boolean) : fallbackImages;

  return (
    <div className="bg-vitamin-glow">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-8">
          <ButtonLink href="/shop" variant="ghost">← Back to shop</ButtonLink>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <ProductGallery images={images} alt={product.name} />

          <div className="rounded-[2rem] border border-orange/15 bg-white/60 p-6 shadow-soft md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{product.category}</Badge>
              {product.badge && <Badge>{product.badge}</Badge>}
              <Badge>Free UK shipping</Badge>
            </div>

            <h1 className="mt-5 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
            <div className="mt-4 text-3xl font-bold text-soft-black">£{Number(product.price_gbp).toFixed(2)}</div>

            <p className="mt-5 text-sm leading-relaxed text-cocoa md:text-base">{product.description}</p>

            <div className="mt-6 rounded-3xl border border-orange/15 bg-cream/80 p-5">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-orange">What makes it glow</div>
              <ul className="mt-4 grid gap-2 text-sm text-cocoa">
                {(product.highlights?.length ? product.highlights : [
                  "Premium skincare collection",
                  "Designed for a luxurious daily routine",
                  "Explore the product details before ordering",
                  "Beautifully presented beauty essentials",
                ]).map((h) => <li key={h}>✓ {h}</li>)}
              </ul>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <AddToCartButton
                item={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price_gbp: Number(product.price_gbp),
                  image: images[0] ?? "",
                }}
              />
              <ButtonLink href="/cart" variant="ghost">Go to cart</ButtonLink>
            </div>

            <div className="mt-6 grid gap-3 text-xs leading-relaxed text-cocoa/80">
              <p>Secure online checkout is being prepared. Contact our team for assistance with your order.</p>
              <p>Avoid direct contact with eyes and discontinue use if irritation occurs.</p>
            </div>
          </div>
        </div>

        <section className="mt-14 rounded-[2rem] bg-[#eee4d9] p-8 md:p-12"><h2 className="font-display text-3xl">A considered skincare ritual</h2><p className="mt-4 max-w-2xl leading-7 text-[#75685e]">Follow the directions on your product packaging. Introduce new skincare gradually and patch test before use.</p></section>
      </div>
    </div>
  );
}
