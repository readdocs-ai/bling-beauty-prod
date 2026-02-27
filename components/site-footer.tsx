import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-champagne/25 bg-soft-black text-ivory">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-sm text-ivory/75">
            <p className="font-display text-base text-champagne">Bling Beauty Products</p>
            <p className="mt-2">
              <a
                href="mailto:info@blingbeautyproducts.com"
                className="underline-offset-4 hover:underline text-ivory/80 hover:text-champagne"
              >
                info@blingbeautyproducts.com
              </a>
            </p>
            <p className="mt-4 text-xs text-ivory/55">Beauty essentials with a soft, polished finish.</p>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-ivory">Explore</div>
          <div className="mt-3 grid gap-2 text-ivory/75">
            <Link href="/shop" className="hover:text-champagne">Shop</Link>
            <Link href="/about" className="hover:text-champagne">About</Link>
            <Link href="/contact" className="hover:text-champagne">Contact</Link>
            <Link href="/policies" className="hover:text-champagne">Policies</Link>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-ivory">Shipping</div>
          <div className="mt-3 grid gap-2 text-ivory/75">
            <span>Free UK shipping</span>
            <span>Tracked delivery</span>
            <span className="text-xs text-ivory/55">Secure checkout powered by Stripe</span>
          </div>
        </div>
      </div>

      <div className="border-t border-champagne/25 py-5 text-center text-xs text-ivory/60">
        © {new Date().getFullYear()} Bling Beauty Products. All rights reserved.
      </div>
    </footer>
  );
}
