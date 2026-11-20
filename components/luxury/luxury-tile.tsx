import Link from "next/link";
import { CollectionImage } from "./collection-image";
import type { LuxuryItem } from "@/lib/luxury-catalogue";

export function LuxuryTile({ item, heading: Heading = "h3" }: { item: LuxuryItem; heading?: "h2" | "h3" }) {
  return (
    <Link
      href={`/luxury/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#e2d8cd] bg-[#fffcf8] transition-colors hover:border-[#b89a81] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#715340]"
    >
      <CollectionImage
        src={`/products/bling-collections/${item.slug}-detail.webp`}
        alt={`${item.name} by Bling Beauty Products`}
        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
      />
      <div className="flex flex-1 flex-col p-4">
        <Heading className="font-display text-2xl leading-tight">{item.name}</Heading>
        <p className="mt-1 text-sm text-[#64554b]">{item.subtitle}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-sm">
          <span className="font-semibold">{`£${item.sellingPrice.toFixed(2)}`}</span>
          <span className="underline underline-offset-4 group-hover:text-[#715340]">View gift set</span>
        </div>
      </div>
    </Link>
  );
}
