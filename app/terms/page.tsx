import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <div className="bg-gold-fade">
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <Badge>Legal</Badge>

          <h1 className="mt-6 font-display text-4xl md:text-5xl">
            Terms & conditions
          </h1>

          <p className="mt-6 text-base text-soft-black/70">
            By using this website and placing an order with Bling Beauty
            Products, you agree to the following terms.
          </p>
        </div>

        <div className="mt-12 grid gap-6">
          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Products</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              All products are described as accurately as possible. Colours and
              finishes may vary slightly due to screen settings.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Orders</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              Orders are subject to availability and acceptance. We reserve the
              right to refuse or cancel orders where necessary.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Pricing & payment</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              All prices are listed in GBP. Payments are securely handled by
              Stripe.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Liability</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              Bling Beauty Products is not liable for indirect or consequential
              damages arising from the use of our products.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
