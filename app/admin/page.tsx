import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { ButtonLink, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProduct } from "@/lib/admin-actions";
import { clearAdminCookie } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

async function logoutAction() {
  "use server";
  clearAdminCookie();
  redirect("/");
}

export default async function AdminPage() {
  const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const products = data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl md:text-4xl">Admin dashboard</h1>
            <Badge>Products</Badge>
          </div>
          <p className="mt-2 text-sm text-soft-black/70">Manage products, images, and Stripe price IDs.</p>
        </div>

        <div className="flex gap-2">
          <ButtonLink href="/admin/new" variant="ghost">New product</ButtonLink>
          <form action={logoutAction}><Button variant="ghost" type="submit">Logout</Button></form>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-soft-black/10 bg-white/60 shadow-soft">
        <div className="grid grid-cols-[1.2fr_0.5fr_0.4fr_0.6fr] gap-2 border-b border-soft-black/10 p-4 text-xs font-semibold text-soft-black/70">
          <div>Product</div><div>Category</div><div>Status</div><div className="text-right">Actions</div>
        </div>

        <div className="divide-y divide-soft-black/10">
          {products.map((p: any) => (
            <div key={p.id} className="grid grid-cols-[1.2fr_0.5fr_0.4fr_0.6fr] gap-2 p-4">
              <div>
                <div className="font-display text-lg">{p.name}</div>
                <div className="mt-1 text-xs text-soft-black/60">/product/{p.slug} • £{Number(p.price_gbp).toFixed(2)}</div>
              </div>
              <div className="text-sm text-soft-black/70">{p.category}</div>
              <div className="text-sm">
                {p.is_active ? (
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-900">Active</span>
                ) : (
                  <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">Hidden</span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Link href={`/admin/edit/${p.id}`} className="rounded-xl px-3 py-2 text-sm hover:bg-soft-black/5">Edit</Link>
                <form action={async () => { "use server"; await deleteProduct(p.id); }}>
                  <button className="rounded-xl px-3 py-2 text-sm text-red-700 hover:bg-red-50">Delete</button>
                </form>
              </div>
            </div>
          ))}

          {!products.length && (
            <div className="p-10 text-center text-sm text-soft-black/70">
              No products yet. Create your first product.
              <div className="mt-4"><ButtonLink href="/admin/new">New product</ButtonLink></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
