import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <div className="rounded-2xl border border-champagne/18 bg-mist/35 p-10 shadow-soft">
        <h1 className="font-display text-3xl">Page not found</h1>
        <p className="mt-3 text-soft-black/70">That page doesn’t exist. Let’s get you back to something beautiful.</p>
        <div className="mt-6 flex gap-3">
          <ButtonLink href="/">Go home</ButtonLink>
          <ButtonLink href="/shop" variant="ghost">Shop</ButtonLink>
        </div>
      </div>
    </div>
  );
}
