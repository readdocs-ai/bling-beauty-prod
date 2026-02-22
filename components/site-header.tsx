"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import { useCart } from "@/components/cart/cart-context";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-soft-black/10 bg-ivory/85 backdrop-blur-md">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative h-10 w-10 overflow-hidden rounded-[14px] bg-soft-black shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
        <Image src="/branding/logo-mark.svg" alt="Bling Beauty mark" fill className="object-cover" />
      </span>
      <span className="font-display text-[17px] font-medium tracking-[-0.01em]">
        Bling <span className="text-soft-black/60">Beauty</span>
      </span>
    </Link>


        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cn("rounded-xl px-4 py-2 text-sm transition hover:bg-soft-black/5", pathname === i.href && "bg-soft-black/5")}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/shop" variant="ghost" className="hidden md:inline-flex">Browse</ButtonLink>
          <ButtonLink href="/cart" className="relative">
            Cart
            {count > 0 && (
              <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-champagne px-2 text-xs font-semibold text-soft-black">
                {count}
              </span>
            )}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
