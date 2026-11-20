import Image from "next/image";
import Link from "next/link";
import { storeContact } from "@/lib/store-contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-orange/15 bg-charcoal text-ivory">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-6 md:grid-cols-[1.1fr_0.7fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-10 overflow-hidden rounded-2xl">
              <Image src="/branding/logo-mark.svg" alt="Bling Beauty Glow mark" fill className="object-cover" />
            </span>
            <div>
              <div className="font-display text-xl text-white">{storeContact.companyName}</div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-tangerine">Luxury skincare & gifting</div>
            </div>
          </div>
          <address className="mt-4 text-sm not-italic leading-relaxed text-ivory/75">
            {storeContact.street}<br />
            {storeContact.locality}
          </address>
          <p className="mt-2 text-sm text-ivory/75">Company registration number {storeContact.registrationNumber}</p>
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
          <div className="font-semibold text-white">Contact &amp; delivery</div>
          <div className="mt-3 grid gap-2 text-ivory/75">
            <a href={storeContact.phoneUrl} className="w-fit hover:text-tangerine">{storeContact.phone}</a>
            <a href={`mailto:${storeContact.email}`} className="w-fit break-all hover:text-tangerine">{storeContact.email}</a>
            <a href={storeContact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-fit hover:text-tangerine">WhatsApp support</a>
            <span>Free standard UK delivery</span>
            <span>{process.env.BLING_CHECKOUT_PROVIDER==='paypal' ? 'Payments processed by PayPal' : 'Card payments processed by Worldpay'}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-ivory/55">
        © {new Date().getFullYear()} {storeContact.companyName}. All rights reserved.
      </div>
    </footer>
  );
}
