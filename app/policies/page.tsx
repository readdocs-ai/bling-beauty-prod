import { Badge } from "@/components/ui/badge";

export default function PoliciesPage() {
  return (
    <div className="bg-gold-fade">
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <Badge>Policies</Badge>
            <Badge>UK shipping</Badge>
          </div>

          <h1 className="mt-6 font-display text-4xl md:text-5xl">
            Store policies
          </h1>

          <p className="mt-6 text-base text-soft-black/70">
            We believe in transparency and clarity. Below you’ll find important
            information about shipping, returns, and privacy when shopping with
            Bling Beauty Products.
          </p>
        </div>

        <div className="mt-12 grid gap-6">
          {/* Shipping */}
          <div className="rounded-2xl border border-soft-black/10 bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Shipping</h2>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              We currently offer free shipping on all orders within the United
              Kingdom. Orders are typically processed within 1–2 business days
              and dispatched using tracked delivery services where available.
            </p>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              You will receive confirmation once your order has been shipped.
            </p>
          </div>

          {/* Returns */}
          <div className="rounded-2xl border border-soft-black/10 bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Returns & refunds</h2>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              If you are not completely satisfied with your purchase, you may
              request a return within 14 days of receiving your order.
            </p>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              For hygiene and safety reasons, certain cosmetic items cannot be
              returned once opened or used, unless they arrive faulty.
            </p>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              To initiate a return, please contact us at{" "}
              <span className="font-medium">
                info@blingbeautyproducts.com
              </span>{" "}
              with your order details.
            </p>
          </div>

          {/* Privacy */}
          <div className="rounded-2xl border border-soft-black/10 bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Privacy & payments</h2>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              We respect your privacy and only collect information necessary to
              process your order and provide customer support.
            </p>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              Payments are securely processed via Stripe. We do not store your
              card details on our servers.
            </p>
            <p className="mt-2 text-sm text-soft-black/70 leading-relaxed">
              By using our website, you agree to the collection and use of
              information in accordance with this policy.
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-soft-black/50">
          This information is provided for general guidance and does not
          constitute legal advice.
        </p>
      </section>
    </div>
  );
}
