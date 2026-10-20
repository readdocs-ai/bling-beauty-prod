import { upsertProduct } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function toLines(value: any) {
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "string") return value;
  return "";
}

export function ProductForm({ product }: { product?: any }) {
  const safeProduct = product ?? null;

  return (
    <form
  action={async (formData) => {
    "use server";
    await upsertProduct(formData);
  }}
      className="grid gap-4 rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft"
    >
      {safeProduct?.id && (
        <input type="hidden" name="id" value={String(safeProduct.id)} />
      )}

      <div className="grid gap-2">
        <label className="text-sm font-medium">Name</label>
        <Input name="name" defaultValue={safeProduct?.name ?? ""} required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Slug</label>
        <Input
          name="slug"
          defaultValue={safeProduct?.slug ?? "luxury-skincare-set"}
          required
        />
        <p className="text-xs text-soft-black/55">
          Use: luxury-skincare-set
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Category</label>
          <select
            name="category"
            defaultValue={safeProduct?.category ?? "Cosmetics"}
            className="w-full rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm outline-none"
          >
            <option value="Cosmetics">Cosmetics</option>
            <option value="Aesthetic Enhancements">Aesthetic Enhancements</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Price (GBP)</label>
          <Input
            name="price_gbp"
            type="number"
            step="0.01"
            defaultValue={safeProduct?.price_gbp ?? 18}
            required
          />
        </div>
      </div>



      <div className="grid gap-2">
        <label className="text-sm font-medium">Short teaser</label>
        <Input
          name="short"
          defaultValue={
            safeProduct?.short ??
            "A considered skincare collection for a beautiful daily ritual."
          }
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          name="description"
          defaultValue={safeProduct?.description ?? ""}
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Highlights</label>
        <Textarea name="highlights" defaultValue={toLines(safeProduct?.highlights)} />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Images</label>
        <Textarea
          name="images"
          defaultValue={
            toLines(safeProduct?.images) ||
            "/products/your-product/hero.jpg\n/products/your-product/detail.jpg"
          }
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Badge</label>
          <select
            name="badge"
            defaultValue={safeProduct?.badge ?? "Best Seller"}
            className="w-full rounded-xl border border-soft-black/10 bg-white/70 px-4 py-3 text-sm outline-none"
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
            defaultChecked={safeProduct?.is_active ?? true}
          />
          Active
        </label>
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <Button type="submit">
          {safeProduct ? "Save changes" : "Create product"}
        </Button>

        <a
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium hover:bg-soft-black/5"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}