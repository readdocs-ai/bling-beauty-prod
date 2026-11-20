import { LuxuryTile } from "@/components/luxury/luxury-tile";
import { giftSetPrice, luxuryItems } from "@/lib/luxury-catalogue";

export const metadata = {
  title: "Shop Skincare Gift Sets | Bling Beauty",
  description: `Browse the BLING skincare gift sets for men and women, from ${giftSetPrice}.`,
};

export default function ShopPage() {
  return (
    <main className="luxury-page">
      <section className="luxury-shop-hero">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-8">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[#715340]">Bling Beauty</p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">Skincare gift sets</h1>
          <p className="mt-2 text-sm leading-6 text-[#64554b] sm:text-base">
            Find Christmas gifts for men and women. <strong className="font-semibold text-[#332b29]">From {giftSetPrice}.</strong>
          </p>
        </div>
      </section>
      <section id="gift-sets" aria-label="Shop BLING gift sets" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {luxuryItems.map(item => <LuxuryTile key={item.slug} item={item} heading="h2" />)}
        </div>
      </section>
    </main>
  );
}
