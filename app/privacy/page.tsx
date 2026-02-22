import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  return (
    <div className="bg-gold-fade">
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <Badge>Privacy</Badge>

          <h1 className="mt-6 font-display text-4xl md:text-5xl">
            Privacy policy
          </h1>

          <p className="mt-6 text-base text-soft-black/70">
            At Bling Beauty Products, we respect your privacy and are committed
            to protecting your personal information.
          </p>
        </div>

        <div className="mt-12 grid gap-6">
          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Information we collect</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              We collect information you provide when placing an order, such as
              your name, email address, shipping address, and payment details.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">How we use your information</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              Your information is used solely to process orders, provide
              customer support, and communicate important updates about your
              purchase.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Payments</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              Payments are securely processed via Stripe. We do not store or
              have access to your card details.
            </p>
          </div>

          <div className="rounded-2xl bg-white/70 p-6 shadow-soft">
            <h2 className="font-semibold text-lg">Contact</h2>
            <p className="mt-2 text-sm text-soft-black/70">
              If you have questions about this policy, contact us at{" "}
              <strong>info@blingbeautyproducts.com</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
