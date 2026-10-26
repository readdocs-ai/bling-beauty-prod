"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import {requireAdminSession} from '@/lib/admin-auth';

const ProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2),
  name: z.string().min(2),
  category: z.enum(["Cosmetics", "Aesthetic Enhancements"]),
  price_gbp: z.coerce.number().min(0),
  short: z.string().min(2),
  description: z.string().min(2),
  highlights: z.string().default(""),
  images: z.string().default(""),
  badge: z.union([z.literal(""), z.enum(["Best Seller", "New", "Limited"])]).default(""),
  is_active: z.coerce.boolean().default(true),
});

export async function upsertProduct(formData: FormData) {
  await requireAdminSession();
  const raw = Object.fromEntries(formData.entries());

  const parsed = ProductSchema.safeParse({
    ...raw,
    highlights: String(raw.highlights ?? ""),
    images: String(raw.images ?? ""),
    badge: String(raw.badge ?? ""),
   is_active: raw.is_active === "on" || raw.is_active === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().fieldErrors };
  }

  const v = parsed.data;

  const payload = {
    slug: v.slug,
    name: v.name,
    category: v.category,
    price_gbp: v.price_gbp,
    short: v.short,
    description: v.description,
    highlights: v.highlights.split("\n").map((s) => s.trim()).filter(Boolean),
    images: v.images.split("\n").map((s) => s.trim()).filter(Boolean),
    badge: v.badge ? (v.badge as any) : null,
    is_active: !!v.is_active,
    updated_at: new Date().toISOString(),
  };

  if (v.id) {
    const { error } = await supabaseAdmin.from("products").update(payload).eq("id", v.id);
    if (error) return { ok: false, error: { server: [error.message] } };
  } else {
    const { error } = await supabaseAdmin.from("products").insert({ ...payload, created_at: new Date().toISOString() });
    if (error) return { ok: false, error: { server: [error.message] } };
  }

  revalidatePath("/shop");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteProduct(id: string) {
  await requireAdminSession();
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/shop");
  revalidatePath("/admin");
  return { ok: true };
}
