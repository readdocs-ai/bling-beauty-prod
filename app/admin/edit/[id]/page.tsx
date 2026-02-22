import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { ButtonLink } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProduct({ params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin.from("products").select("*").eq("id", params.id).maybeSingle();
  if (error) throw error;
  if (!data) return notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ButtonLink href="/admin" variant="ghost">← Back</ButtonLink>
      <h1 className="mt-6 font-display text-4xl">Edit product</h1>
      <div className="mt-8"><ProductForm product={data as any} /></div>
    </div>
  );
}
