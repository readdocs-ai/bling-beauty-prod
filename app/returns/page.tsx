import { Badge } from "@/components/ui/badge";

export default function ReturnsPage() {
  return (
    <div className="bg-gold-fade">
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <Badge>Returns</Badge>

          <h1 className="mt-6 font-display text-4xl md:text-5xl">
            Returns & refunds
          </h1>

          <p className="mt-6 text-base text-soft-black/70">
            We want you to feel confident shopping with Bling Beauty Products.
          </p>
        </div>

        <div className="mt-12 grid gap-6">
          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Returns window</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              Returns can be requested within 14 days of receiving your order.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Cosmetic items</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              For hygiene reasons, opened or used cosmetic products cannot be
              returned unless faulty.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">How to request a return</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              Please email <strong>info@blingbeautyproducts.com</strong> with
              your order number and reason for return.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
