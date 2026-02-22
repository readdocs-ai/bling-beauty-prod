import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-soft-black/10 bg-ivory">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-sm text-soft-black/70">
  <p>Bling Beauty Products</p>
  <p className="mt-1">
    <a
      href="mailto:info@blingbeautyproducts.com"
      className="underline-offset-4 hover:underline"
    >
      info@blingbeautyproducts.com
    </a>
  </p>
</div>
        </div>

        <div className="text-sm">
          <div className="font-semibold">Explore</div>
          <div className="mt-3 grid gap-2 text-soft-black/70">
            <Link href="/shop" className="hover:text-soft-black">Shop</Link>
            <Link href="/about" className="hover:text-soft-black">About</Link>
            <Link href="/contact" className="hover:text-soft-black">Contact</Link>
            <Link href="/policies" className="hover:text-soft-black">Policies</Link>
      
          </div>
        </div>

        <div className="text-sm">
          <div className="font-semibold">Shipping</div>
          <div className="mt-3 grid gap-2 text-soft-black/70">
            <span>Free UK shipping</span>
            <span>Tracked delivery</span>
            <span className="text-xs text-soft-black/50"></span>
          </div>
        </div>
      </div>

      <div className="border-t border-soft-black/10 py-5 text-center text-xs text-soft-black/60">
        © {new Date().getFullYear()} Bling Beauty Products. All rights reserved.
      </div>
    </footer>
  );
}
