import Image from "next/image";
import { listProducts } from "@/lib/products";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const products = await listProducts();
  const featured = products.slice(0, 3);

  return (
    <div className="bg-gold-fade">
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <Badge>Light • Luxury • Glow</Badge>
              <Badge>Free UK shipping</Badge>
            </div>

            <h1 className="mt-6 font-display text-4xl leading-tight md:text-5xl">
              Beauty that shines—without shouting.
            </h1>

            <p className="mt-5 max-w-xl text-base text-soft-black/70">
              Bling Beauty Products brings refined cosmetics and aesthetic enhancement essentials together in one modern boutique.
              Clean layouts, elevated textures, and a polished finish.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop">Shop the collection</ButtonLink>
              <ButtonLink href="/about" variant="ghost">
                Our story
              </ButtonLink>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-soft-black/10 bg-white/60 p-4 shadow-soft">
                <div className="font-semibold">Crafted elegance</div>
                <div className="mt-1 text-soft-black/70 text-xs">
                  Thoughtfully designed products with a refined, modern finish.
                </div>
              </div>

              <div className="rounded-2xl border border-soft-black/10 bg-white/60 p-4 shadow-soft">
                <div className="font-semibold">Effortless shopping</div>
                <div className="mt-1 text-soft-black/70 text-xs">
                  A smooth, secure checkout designed to feel seamless.
                </div>
              </div>

              <div className="rounded-2xl border border-soft-black/10 bg-white/60 p-4 shadow-soft">
                <div className="font-semibold">Beautifully presented</div>
                <div className="mt-1 text-soft-black/70 text-xs">
                  Clean product imagery that lets every detail shine.
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-white/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-soft-black/10 bg-white/50 shadow-luxe">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/branding/hero.jpg"
                  alt="Luxury beauty flatlay"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              <div className="grid gap-2 p-6">
                <div className="font-display text-xl">Designed to glow</div>
                <p className="text-sm text-soft-black/70">
                  A calm, elevated aesthetic created for beauty that speaks softly and lasts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">Featured</h2>
            <p className="mt-2 text-sm text-soft-black/70">Best-sellers and new arrivals.</p>
          </div>
          <ButtonLink href="/shop" variant="ghost" className="hidden md:inline-flex">
            View all →
          </ButtonLink>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <ButtonLink href="/shop" variant="ghost" className="w-full justify-center">
            View all products →
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
