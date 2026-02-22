import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  return (
    <div className="bg-gold-fade">
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <Badge>Our story</Badge>
            <Badge>Modern beauty</Badge>
          </div>

          <h1 className="mt-6 font-display text-4xl md:text-5xl">
            Bling Beauty Products
          </h1>

          <p className="mt-6 text-base text-soft-black/70 leading-relaxed">
            Luxury should feel light — never loud. At Bling Beauty Products, we
            believe beauty is at its best when it’s effortless, refined, and
            thoughtfully made.
          </p>

          <p className="mt-4 text-base text-soft-black/70 leading-relaxed">
            Our collection focuses on high-quality cosmetics and aesthetic beauty
            essentials, curated for modern lifestyles. Each product is chosen to
            enhance your natural features while fitting seamlessly into your
            everyday routine.
          </p>

          <p className="mt-4 text-base text-soft-black/70 leading-relaxed">
            We prioritise wearability, comfort, and timeless appeal — offering
            products that feel considered, indulgent, and easy to love.
          </p>

          <p className="mt-4 text-base text-soft-black/70 leading-relaxed">
            With free UK shipping and secure checkout via Stripe, you can shop
            with confidence knowing every order is handled with care from start
            to finish.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft">
            <div className="font-semibold">Refined cosmetics</div>
            <p className="mt-2 text-sm text-soft-black/70">
              Carefully selected beauty products designed to feel elegant,
              wearable, and effortlessly polished.
            </p>
          </div>

          <div className="rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft">
            <div className="font-semibold">Thoughtful curation</div>
            <p className="mt-2 text-sm text-soft-black/70">
              A focused range that enhances your routine without excess —
              quality over quantity, always.
            </p>
          </div>

          <div className="rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft">
            <div className="font-semibold">Trusted shopping</div>
            <p className="mt-2 text-sm text-soft-black/70">
              Secure Stripe payments and free UK shipping on all orders, for a
              smooth and reliable shopping experience.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
