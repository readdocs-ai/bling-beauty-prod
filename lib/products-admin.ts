import { supabaseAdmin } from "@/lib/supabase";
import type { Product } from "@/lib/product-types";

export async function getAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAdminProducts error:", error);
    return [];
  }

  return (data ?? []) as Product[];
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getAdminProductById error:", error);
    return null;
  }

  return (data ?? null) as Product | null;
}