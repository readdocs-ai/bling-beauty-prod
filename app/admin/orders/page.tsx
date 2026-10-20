import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function display(value: unknown) { return value === null || value === undefined || value === "" ? "—" : String(value); }
function status(value: unknown) { return String(value ?? "unknown").trim().toLowerCase() || "unknown"; }
function amount(o: Record<string, unknown>) {
  const gbp = o.total_gbp ?? o.total_amount_gbp;
  if (gbp !== undefined && gbp !== null && Number.isFinite(Number(gbp))) return `£${Number(gbp).toFixed(2)}`;
  return "—";
}
function date(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { timeZone: "Europe/London" });
}

export default async function OrdersPage({ searchParams }: { searchParams?: { q?: string; payment?: string; fulfilment?: string } }) {
  const q = String(searchParams?.q ?? "").trim().toLowerCase().slice(0, 120);
  const payment = String(searchParams?.payment ?? "").trim().toLowerCase().slice(0, 80);
  const fulfilment = String(searchParams?.fulfilment ?? "").trim().toLowerCase().slice(0, 80);
  const { data, error } = await supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
  const orders = (data ?? []) as Record<string, unknown>[];
  const payments = Array.from(new Set(orders.map(o => status(o.payment_status)))).sort();
  const fulfilments = Array.from(new Set(orders.map(o => status(o.fulfilment_status ?? o.status)))).sort();
  const filtered = orders.filter(o => {
    if (payment && status(o.payment_status) !== payment) return false;
    if (fulfilment && status(o.fulfilment_status ?? o.status) !== fulfilment) return false;
    return !q || [o.id, o.order_number, o.customer_email, o.email, o.customer_name, o.name, o.customer_phone, o.phone, o.payment_status, o.fulfilment_status, o.status].some(v => String(v ?? "").toLowerCase().includes(q));
  });
  const pending = orders.filter(o => !["paid", "captured", "succeeded", "refunded"].includes(status(o.payment_status))).length;
  const awaitingDispatch = orders.filter(o => ["paid", "captured", "succeeded"].includes(status(o.payment_status)) && !["fulfilled", "dispatched", "shipped", "delivered", "cancelled"].includes(status(o.fulfilment_status ?? o.status))).length;
  return <main className="mx-auto max-w-6xl px-4 py-12">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin" className="text-sm underline">← Dashboard</Link><h1 className="mt-3 font-display text-4xl">Customer orders</h1><p className="mt-2 text-sm text-soft-black/70">Review and filter the latest 500 orders. No records or payment statuses are changed here.</p></div><div className="flex flex-wrap gap-2"><a href="/admin/orders/export" className="rounded-xl bg-soft-black px-4 py-2 text-sm text-white">Export latest 500 orders</a></div></div>
    {!error && <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-soft-black/60">Recent records</div><div className="mt-1 text-2xl font-semibold">{orders.length}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-soft-black/60">Not marked paid</div><div className="mt-1 text-2xl font-semibold">{pending}</div></div><div className="rounded-2xl border bg-white p-4"><div className="text-xs text-soft-black/60">Paid, potentially awaiting dispatch</div><div className="mt-1 text-2xl font-semibold">{awaitingDispatch}</div></div></div>}
    <form className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px_auto]" action="/admin/orders"><input name="q" defaultValue={q} aria-label="Search orders" placeholder="Search order, customer, email or phone" className="min-w-0 rounded-xl border border-soft-black/20 bg-white px-4 py-3"/><select name="payment" defaultValue={payment} aria-label="Filter payment status" className="min-w-0 rounded-xl border border-soft-black/20 bg-white px-3 py-3"><option value="">All payment statuses</option>{payments.map(v => <option key={v} value={v}>{v}</option>)}</select><select name="fulfilment" defaultValue={fulfilment} aria-label="Filter fulfilment status" className="min-w-0 rounded-xl border border-soft-black/20 bg-white px-3 py-3"><option value="">All fulfilment statuses</option>{fulfilments.map(v => <option key={v} value={v}>{v}</option>)}</select><button className="rounded-xl bg-soft-black px-5 py-3 text-white">Filter</button></form>
    {(q || payment || fulfilment) && <Link href="/admin/orders" className="mt-3 inline-block text-sm underline">Clear filters</Link>}
    {error ? <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Unable to load orders from Supabase. Confirm the orders table exists and its schema. {error.message}</div> : <>
      <p className="mt-5 text-sm text-soft-black/60">Showing {filtered.length} of {orders.length} fetched orders. Filters and summary cards cover only these recent records.</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-soft-black/10 bg-white"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b bg-rose-50/50"><tr>{["Order", "Customer", "Date", "Total", "Payment", "Fulfilment"].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{filtered.map((o, i) => <tr key={String(o.id ?? i)} className="border-b border-soft-black/10"><td className="px-4 py-4 font-medium"><Link className="underline decoration-soft-black/30 underline-offset-4 hover:decoration-soft-black" href={`/admin/orders/${encodeURIComponent(String(o.id ?? ""))}`}>{display(o.order_number ?? o.id)}</Link></td><td className="px-4 py-4"><div>{display(o.customer_name ?? o.name)}</div><div className="text-xs text-soft-black/60">{display(o.customer_email ?? o.email)}</div></td><td className="px-4 py-4">{date(o.created_at)}</td><td className="px-4 py-4">{amount(o)}</td><td className="px-4 py-4">{display(o.payment_status)}</td><td className="px-4 py-4">{display(o.fulfilment_status ?? o.status)}</td></tr>)}{!filtered.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-soft-black/60">No matching orders.</td></tr>}</tbody></table></div>
      <p className="mt-4 text-xs text-soft-black/60">CSV export includes the latest 500 records, regardless of on-screen filters. Status values come from the database and are not proof of a verified Worldpay payment. Confirm payment with your provider before dispatch.</p>
    </>}
  </main>;
}
