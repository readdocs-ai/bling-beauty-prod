import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { ProductDetail } from "@/components/product/product-detail";

function slugify(input?: string | null) {
  const value = (input ?? "").toString();
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default async function ProductPage({ params }: { params: { slug?: string } }) {
  const raw = params?.slug ?? "";
  if (!raw) return notFound();

  const normalized = slugify(raw);

  const product = (await getProductBySlug(raw)) || (await getProductBySlug(normalized));
  if (!product) return notFound();

  return <ProductDetail product={product} />;
}
