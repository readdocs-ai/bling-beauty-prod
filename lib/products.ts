import { supabasePublic } from "@/lib/supabase";
import type { Product } from "@/lib/product-types";
import { luxuryItems } from "@/lib/luxury-catalogue";

const approvedSlugs = new Set(luxuryItems.map((item) => item.slug));

export async function listProducts() {
  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Product[]).filter((product) => approvedSlugs.has(product.slug));
}

export async function getProductBySlug(slug: string) {
  if (!approvedSlugs.has(slug)) return null;
  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Product | null;
}
