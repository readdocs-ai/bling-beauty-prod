import { upsertProduct } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { redirect } from "next/navigation";

export function ProductForm({ product }: { product?: any }) {
  const highlights = (product?.highlights ?? []).join("\n");
  const images = (product?.images ?? []).join("\n");

  return (
    <form
      action={async (formData) => {
        "use server";

        // IMPORTANT: rely on the hidden input "id" below.
        // Do NOT set formData.set("id", ...) here.

        const res = await upsertProduct(formData);

        // If something fails, do NOT silently redirect.
        if (!res?.ok) {
          console.error("SAVE FAILED:", res?.error);
          // Keep user on page; they can check terminal for details.
          return;
        }

        redirect("/admin");
      }}
      className="grid gap-4 rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft"
    >
      {/* ✅ This is the source of truth for edits */}
      <input type="hidden" name="id" value={product?.id ? String(product.id) : ""} />

      <div className="grid gap-2">
        <label className="text-sm font-medium">Name</label>
        <Input name="name" defaultValue={product?.name ?? ""} required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Slug</label>
        <Input name="slug" defaultValue={product?.slug ?? ""} required />
        <p className="text-xs text-soft-black/55">
          We automatically lowercase/format this on save.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Category</label>
          <select
            name="category"
            defaultValue={product?.category ?? "Cosmetics"}
            className="w-full rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-soft-black/30 focus:ring-2 focus:ring-champagne/30"
          >
            <option>Cosmetics</option>
            <option>Aesthetic Enhancements</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Price (GBP)</label>
          <Input
            name="price_gbp"
            type="number"
            step="0.01"
            defaultValue={product?.price_gbp ?? 0}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Stripe price ID</label>
        <Input
          name="stripe_price_id"
          defaultValue={product?.stripe_price_id ?? ""}
          required
        />
        <p className="text-xs text-soft-black/55">Must be a Stripe Price ID like: price_...</p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Short teaser</label>
        <Input name="short" defaultValue={product?.short ?? ""} required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea name="description" defaultValue={product?.description ?? ""} required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Highlights (one per line)</label>
        <Textarea name="highlights" defaultValue={highlights} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Images (one URL per line)</label>
        <Textarea name="images" defaultValue={images} />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Badge</label>
          <select
            name="badge"
            defaultValue={product?.badge ?? ""}
            className="w-full rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm outline-none focus:border-soft-black/30 focus:ring-2 focus:ring-champagne/30"
          >
            <option value="">None</option>
            <option>Best Seller</option>
            <option>New</option>
            <option>Limited</option>
          </select>
        </div>

        <label className="mt-7 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product?.is_active ?? true}
          />
          Active (visible in shop)
        </label>
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <Button type="submit">{product ? "Save changes" : "Create product"}</Button>
        <a
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition bg-transparent text-soft-black hover:bg-soft-black/5"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}