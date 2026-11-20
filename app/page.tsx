import Image from "next/image";
import Link from "next/link";
import { LuxuryTile } from "@/components/luxury/luxury-tile";
import { giftSetPrice, luxuryItems } from "@/lib/luxury-catalogue";
import { storeContact } from "@/lib/store-contact";

export const metadata = {
  title: "Christmas Skincare Gift Sets | Bling Beauty Products",
  description: `Shop beautifully presented BLING skincare gift sets for men and women, from ${giftSetPrice}.`,
};

export default function HomePage() {
  return (
    <main className="luxury-page">
      <section className="luxury-shop-hero" aria-labelledby="christmas-gifts">
        <div className="mx-auto grid max-w-7xl items-center gap-5 px-5 py-5 sm:gap-8 sm:px-6 sm:py-8 md:grid-cols-[1fr_1.05fr] lg:gap-12 lg:py-10">
          <div className="max-w-xl">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[#715340]"><span aria-hidden="true">✦</span> Christmas at Bling Beauty</p>
            <h1 id="christmas-gifts" className="mt-3 font-display text-[clamp(2.25rem,5vw,3.85rem)] leading-[1.04] tracking-tight">
              Christmas gift sets{" "}
              <span className="block italic text-[#715340]">for him and her</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#64554b] sm:text-base">
              Beautifully presented skincare gifts for men and women.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/shop#gift-sets"
                className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#2b4335] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d3427] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2b4335]"
              >
                Buy your gifts now <span aria-hidden="true">→</span>
              </Link>
              <p className="text-sm font-semibold">From {giftSetPrice}</p>
            </div>
          </div>
          <div className="relative aspect-[2/1] overflow-hidden rounded-xl ring-1 ring-[#8c7867]/30 md:aspect-[8/5]">
            <Image
              src="/products/bling-collections/bling-renew-restore-collection-detail.webp"
              alt="BLING Renew & Restore skincare gift set in emerald and gold packaging"
              fill
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 51vw, 630px"
              className="object-cover object-[center_45%]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-9" aria-labelledby="featured-gifts">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d9cdc0] pb-3 sm:mb-5">
          <h2 id="featured-gifts" className="font-display text-3xl tracking-tight sm:text-4xl">Featured gift sets</h2>
          <Link href="/shop#gift-sets" className="inline-flex min-h-11 items-center text-sm font-semibold underline hover:text-[#715340]">
            Shop all gift sets <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {luxuryItems.slice(0, 3).map(item => <LuxuryTile key={item.slug} item={item} />)}
        </div>
      </section>

      <section className="border-t border-[#e2d8cd] bg-[#f1e9df]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-2xl">Need help choosing a gift?</h2>
            <p className="mt-1 text-sm text-[#64554b]">Ask us about our collections or UK delivery.</p>
          </div>
          <a href={storeContact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold underline hover:text-[#715340]">
            Chat on WhatsApp <span aria-hidden="true" className="ml-2">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}
