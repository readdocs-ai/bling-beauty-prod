import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertProduct } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

function toLines(value: any) {
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "string") return value;
  return "";
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProduct({ params }: PageProps) {
  const resolved = await params;
  const id = resolved?.id;

  if (!id) return notFound();

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return notFound();

  async function saveProduct(formData: FormData) {
    "use server";
    formData.set("id", id);
    await upsertProduct(formData);
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <a href="/admin" className="text-sm hover:underline">
        ← Back to admin
      </a>

      <h1 className="mt-6 font-display text-4xl">Edit product</h1>

      <form
        action={saveProduct}
        className="mt-8 grid gap-4 rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft"
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium">Name</label>
          <Input name="name" defaultValue={data.name ?? ""} required />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Slug</label>
          <Input
            name="slug"
            defaultValue={data.slug ?? "luxury-skincare-set"}
            required
          />
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Category</label>
            <select
              name="category"
              defaultValue={data.category ?? "Cosmetics"}
              className="rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm"
            >
              <option value="Cosmetics">Cosmetics</option>
              <option value="Aesthetic Enhancements">
                Aesthetic Enhancements
              </option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Price GBP</label>
            <Input
              name="price_gbp"
              type="number"
              step="0.01"
              defaultValue={data.price_gbp ?? 18}
              required
            />
          </div>
        </div>



        <div className="grid gap-2">
          <label className="text-sm font-medium">Short teaser</label>
          <Input name="short" defaultValue={data.short ?? ""} required />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            name="description"
            defaultValue={data.description ?? ""}
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Highlights</label>
          <Textarea
            name="highlights"
            defaultValue={toLines(data.highlights)}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Images</label>
          <Textarea
            name="images"
            defaultValue={
              toLines(data.images) ||
              "/products/your-product/hero.jpg\n/products/your-product/detail.jpg"
            }
          />
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Badge</label>
            <select
              name="badge"
              defaultValue={data.badge ?? "Best Seller"}
              className="rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm"
            >
              <option value="">None</option>
              <option value="Best Seller">Best Seller</option>
              <option value="New">New</option>
              <option value="Limited">Limited</option>
            </select>
          </div>

          <label className="mt-7 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={data.is_active ?? true}
            />
            Active
          </label>
        </div>

        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}