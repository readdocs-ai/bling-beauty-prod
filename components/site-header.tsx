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
    <header className="sticky top-0 z-50 border-b border-champagne/25 bg-soft-black/95 text-ivory backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="group flex items-center gap-4">
          <span className="relative h-10 w-10 overflow-hidden rounded-[14px] bg-soft-black shadow-[0_6px_18px_rgba(0,0,0,0.35)] border border-champagne/25">
            <Image
              src="/branding/logo-mark.svg"
              alt="Bling Beauty mark"
              fill
              className="object-cover"
              priority
            />
          </span>

          <span className="font-display text-[22px] font-semibold tracking-[-0.01em] bg-gradient-to-r from-[#FFD700] via-[#FFF2A8] to-[#FFC300] bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(255,215,0,0.25)]">
  Bling Beauty
</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm text-ivory/80 transition hover:bg-ivory/10 hover:text-ivory",
                pathname === i.href && "bg-ivory/10 text-ivory"
              )}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/shop" variant="ghost" className="hidden md:inline-flex">
            Browse
          </ButtonLink>

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