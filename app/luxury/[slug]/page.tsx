import Link from "next/link";
import Image from "next/image";
import { CollectionImage } from "@/components/luxury/collection-image";
import { AddToCartButton } from "@/components/product/add-to-cart";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function LuxuryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = product.images?.filter(Boolean) ?? [];
  const mainImage = images[0] ?? `/products/bling-collections/${product.slug}.webp`;
  const detailImage = images[1] ?? `/products/bling-collections/${product.slug}-detail.webp`;

  return (
    <main className="luxury-page min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/shop" className="text-sm underline underline-offset-4">← Back to collection</Link>
        <p className="luxury-eyebrow mt-16">BLING / LUXURY SKINCARE</p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl md:text-7xl">{product.name}</h1>
        <p className="mt-6 max-w-2xl text-xl text-[#76685d]">{product.short}</p>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <CollectionImage src={mainImage} alt={product.name} sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="relative aspect-[87/64] overflow-hidden bg-[#e7dfd5]">
              <Image src={detailImage} alt={`${product.name} packaging detail`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-lg leading-8">{product.description}</p>
            <p className="text-sm">{`Bling Beauty price: £${Number(product.price_gbp).toFixed(2)}`}</p>
            <p className="border-y border-[#d9cdc0] py-5 text-sm leading-7">A thoughtful gift or a little luxury for your own beauty routine. Need help choosing? Contact our team for collection details and personal assistance.</p>
            <AddToCartButton item={{ id: product.id, slug: product.slug, name: product.name, price_gbp: Number(product.price_gbp), image: mainImage }} />
          </div>
        </div>
      </div>
    </main>
  );
}
