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
    <header className="sticky top-0 z-50 border-b border-orange/15 bg-ivory/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative h-11 w-11 overflow-hidden rounded-2xl shadow-soft ring-1 ring-orange/20">
            <Image src="/branding/logo-mark.svg" alt="Bling Beauty Glow mark" fill className="object-cover" priority />
          </span>
          <span className="grid leading-none">
            <span className="font-display text-xl font-semibold tracking-tight text-soft-black">Bling Beauty</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-orange">Prestige skincare</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-cocoa transition hover:bg-orange/10 hover:text-soft-black",
                pathname === i.href && "bg-orange/10 text-soft-black"
              )}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/shop" variant="ghost" className="hidden md:inline-flex">The boutique</ButtonLink>
          <ButtonLink href="/cart" className="relative px-5 py-2.5">
            Cart
            {count > 0 && (
              <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-orange">
                {count}
              </span>
            )}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
