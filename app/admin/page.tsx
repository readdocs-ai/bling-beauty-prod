import Link from "next/link";
import { getOrderingState } from "@/lib/order-switch";
import { supabaseAdmin } from "@/lib/supabase";
import { ButtonLink, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProduct } from "@/lib/admin-actions";
import { clearAdminCookie } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

// Admin data must be read per request, never fetched into a static build.
export const dynamic = "force-dynamic";

async function logoutAction() {
  "use server";
  await clearAdminCookie();
  redirect("/");
}

export default async function AdminPage() {
  const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const products = data ?? [];
  const ordering = await getOrderingState();

  const { data: recentOrders, error: orderError } = await supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(8);
  const ordersAvailable = !orderError;
  const orders = recentOrders ?? [];
  const paid = orders.filter((o: any) => ["paid", "captured", "succeeded"].includes(String(o.payment_status ?? "").toLowerCase()));
  const sales = paid.reduce((sum: number, o: any) => sum + Number(o.total_gbp ?? o.total_amount_gbp ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl md:text-4xl">Admin dashboard</h1>
            <Badge>Products</Badge>
          </div>
          <p className="mt-2 text-sm text-soft-black/70">Your catalogue, customer orders and store overview in one place.</p>
        </div>

        <div className="flex gap-2">
          <ButtonLink href="/admin/new" variant="ghost">New product</ButtonLink>
          <form action={logoutAction}><Button variant="ghost" type="submit">Logout</Button></form>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-soft-black/10 bg-white p-5"><h2 className="font-display text-xl">New orders switch</h2><p className="mt-2 font-semibold">{ordering.configured ? (ordering.suspended ? "Suspended" : "Accepting new orders") : "Not configured — blocked"}</p><Link href="/admin/order-settings" className="mt-3 inline-block rounded-xl bg-soft-black px-4 py-2 text-sm text-white">Manage new orders</Link></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-soft-black/10 bg-white p-5"><div className="text-sm text-soft-black/60">Products</div><div className="mt-2 font-display text-3xl">{products.length}</div></div>
        <div className="rounded-2xl border border-soft-black/10 bg-white p-5"><div className="text-sm text-soft-black/60">Recent orders</div><div className="mt-2 font-display text-3xl">{ordersAvailable ? orders.length : "—"}</div><div className="mt-1 text-xs text-soft-black/60">Latest 8 records, not lifetime total</div></div>
        <div className="rounded-2xl border border-soft-black/10 bg-white p-5"><div className="text-sm text-soft-black/60">Paid value in recent orders</div><div className="mt-2 font-display text-3xl">{ordersAvailable ? `£${sales.toFixed(2)}` : "—"}</div><div className="mt-1 text-xs text-soft-black/60">Only records with recognised paid status and GBP total</div></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-soft-black/10 bg-white p-5">
        <div><h2 className="font-display text-xl">Orders and customers</h2><p className="mt-1 text-sm text-soft-black/60">Review recent orders and search your order history.</p></div>
        <Link href="/admin/orders" className="rounded-xl bg-soft-black px-4 py-2 text-sm font-medium text-white">View orders</Link>
      </div>
      {!ordersAvailable && <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Order records could not be loaded. Check that your Supabase orders table and access permissions are configured. Product management remains available.</p>}
      <div className="mt-5 rounded-2xl border border-soft-black/10 bg-white p-5"><h2 className="font-display text-xl">Customer email templates</h2><p className="mt-1 text-sm text-soft-black/60">Review order confirmation, payment and dispatch wording before activating email delivery.</p><Link href="/admin/email-preview" className="mt-3 inline-block rounded-xl bg-soft-black px-4 py-2 text-sm text-white">Preview emails</Link></div>
      <div className="mt-5 rounded-2xl border border-soft-black/10 bg-white p-5"><h2 className="font-display text-xl">Launch readiness</h2><p className="mt-1 text-sm text-soft-black/60">Check whether required environment settings are present without exposing credentials. Worldpay checkout remains disabled.</p><Link href="/admin/readiness" className="mt-3 inline-block rounded-xl bg-soft-black px-4 py-2 text-sm text-white">View readiness checks</Link></div>
      <h2 className="mt-10 font-display text-2xl">Product catalogue</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-soft-black/10 bg-white/60 shadow-soft">
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
