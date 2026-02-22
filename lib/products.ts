import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/product-types";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * Used by homepage + shop page.
 * Returns active products ordered newest-first.
 */
export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listProducts error:", error);
    return [];
  }

  return (data ?? []) as Product[];
}

/**
 * Used by product detail page.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return (data ?? null) as Product | null;
}

/**
 * Backwards-compatible alias (if any file still calls this).
 */
export async function getActiveProducts(): Promise<Product[]> {
  return listProducts();
}