import { supabasePublic } from "@/lib/supabase";
import type { Product } from "@/lib/product-types";

export async function listProducts() {
  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Product[]).filter((product) => product.slug?.startsWith("bling-"));
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabasePublic
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!slug.startsWith("bling-")) return null;
  return (data ?? null) as Product | null;
}
