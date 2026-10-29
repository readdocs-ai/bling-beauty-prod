import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-orange/15 bg-charcoal text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-10 overflow-hidden rounded-2xl">
              <Image src="/branding/logo-mark.svg" alt="Bling Beauty Glow mark" fill className="object-cover" />
            </span>
            <div>
              <div className="font-display text-xl text-white">Bling Beauty</div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-tangerine">Luxury skincare & gifting</div>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/70">
            Discover considered skincare, prestige beauty and thoughtful gifting at Bling Beauty Products.
          </p>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-white">Explore</div>
          <div className="mt-3 grid gap-2 text-ivory/70">
            <Link href="/shop" className="hover:text-tangerine">Shop the collection</Link>
            <Link href="/about" className="hover:text-tangerine">About</Link>
            <Link href="/contact" className="hover:text-tangerine">Contact</Link>
            <Link href="/policies" className="hover:text-tangerine">Policies</Link>
            <Link href="/terms" className="hover:text-tangerine">Terms</Link>
            <Link href="/returns" className="hover:text-tangerine">Returns & refunds</Link>
            <Link href="/privacy" className="hover:text-tangerine">Privacy</Link>
            <Link href="/shipping" className="hover:text-tangerine">Delivery</Link>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-white">Shop confidence</div>
          <div className="mt-3 grid gap-2 text-ivory/70">
            <span>UK delivery options at checkout</span>
            <span>Secure payment options coming soon</span>
            <span>Need assistance? Get in touch</span>
            <span className="text-xs text-ivory/50">Contact us for help with your order.</span>
          <a href="mailto:info@blingbeautyproducts.com" className="hover:text-tangerine">info@blingbeautyproducts.com</a>
            <a href="https://wa.me/447459676630" target="_blank" rel="noopener noreferrer" className="hover:text-tangerine">WhatsApp support</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-ivory/55">
        © {new Date().getFullYear()} Bling Beauty Products. All rights reserved.
      </div>
    </footer>
  );
}
