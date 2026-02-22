"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const ProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  name: z.string().min(2),
  category: z.enum(["Cosmetics", "Aesthetic Enhancements"]),
  price_gbp: z.coerce.number().min(0),
  short: z.string().min(2),
  description: z.string().min(2),
  highlights: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  badge: z.union([z.literal(""), z.enum(["Best Seller", "New", "Limited"])]).default(""),
  stripe_price_id: z.string().min(2),
  is_active: z.coerce.boolean().default(true),
});

export async function upsertProduct(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());

  const id =
    typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : null;

  const slugCandidate = String(raw.slug ?? raw.name ?? "");
  const finalSlug = slugify(slugCandidate);
const parsed = ProductSchema.safeParse({
  ...raw,
  id: id ?? undefined,
  slug: finalSlug,
  price_gbp: Number(raw.price_gbp),
  highlights: String(raw.highlights ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean),
  images: String(raw.images ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean),
  badge: String(raw.badge ?? ""),
  is_active:
    String(raw.is_active ?? "") === "on" ||
    String(raw.is_active ?? "") === "true",
});

if (!parsed.success) {
  return { ok: false, error: parsed.error.flatten().fieldErrors };
}

  const payload: any = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    category: parsed.data.category,
    price_gbp: parsed.data.price_gbp,
    stripe_price_id: parsed.data.stripe_price_id,
    short: parsed.data.short,
    description: parsed.data.description,
    highlights: parsed.data.highlights,
    images: parsed.data.images,
    badge: parsed.data.badge || null,
    is_active: parsed.data.is_active,
    updated_at: new Date().toISOString(),
  };

  let data: any = null;

  if (id) {
    const res = await supabaseAdmin
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (res.error) {
      console.error("SUPABASE UPDATE ERROR:", res.error);
      return { ok: false, error: res.error.message };
    }
    data = res.data;
  } else {
    const res = await supabaseAdmin
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (res.error) {
      console.error("SUPABASE INSERT ERROR:", res.error);
      return { ok: false, error: res.error.message };
    }
    data = res.data;
  }

  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/product/${parsed.data.slug}`);

  return { ok: true, data };
}

// ✅ ADD THIS (fixes your admin delete import)
export async function deleteProduct(id: string) {
  if (!id) return { ok: false, error: "Missing product id" };

  const res = await supabaseAdmin.from("products").delete().eq("id", id);

  if (res.error) {
    console.error("SUPABASE DELETE ERROR:", res.error);
    return { ok: false, error: res.error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/");

  return { ok: true };
}