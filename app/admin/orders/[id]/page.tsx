import Link from "next/link";
import PrintOrderButton from "@/components/admin/print-order-button";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import {normaliseAdminOrder} from '@/lib/admin-orders.mjs';

export const dynamic = "force-dynamic";

function shown(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  if (!id || id.length > 150) notFound();
  const [legacy,worldpay]=await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('id',id).maybeSingle(),
    supabaseAdmin.from('bling_paid_orders').select('*').eq('id',id).eq('status','paid').maybeSingle(),
  ]);
  if (legacy.error||worldpay.error||(!legacy.data&&!worldpay.data)) notFound();
  const order = normaliseAdminOrder(worldpay.data??legacy.data,worldpay.data?'worldpay':'orders');
  const {data:jobs}=worldpay.data?await supabaseAdmin.from('bling_paid_order_jobs').select('kind,status,completed_at,last_error').eq('order_id',id):{data:null};
  const fields: { title: string; names: string[] }[] = [
    { title: "Customer", names: ["customer_name", "name", "customer_email", "email", "customer_phone", "phone"] },
    { title: "Delivery", names: ["shipping_name", "shipping_address", "shipping_address_line1", "shipping_address_line2", "shipping_city", "shipping_postcode", "shipping_country", "address", "postcode"] },
    { title: "Payment and fulfilment", names: ["payment_provider", "payment_environment", "payment_verified_at", "payment_status", "fulfilment_status", "status", "total_gbp", "total_amount_gbp", "currency", "created_at", "updated_at"] },
    { title: "Order contents", names: ["items", "line_items", "products", "shipping_gbp", "delivery_gbp", "notes"] },
  ];
  return <main className="mx-auto max-w-5xl px-4 py-12">
    <Link href="/admin/orders" className="text-sm underline">← Back to orders</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-3"><div><h1 className="font-display text-4xl">Order details</h1><p className="mt-2 break-all text-sm text-soft-black/60">Reference: {shown(order.order_number ?? order.id)}</p><PrintOrderButton /></div></div>
    <p className="print:hidden mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Read-only record. Payment is not considered verified solely because a customer returned from checkout. Confirm payment in your provider dashboard before dispatch.</p>
    {order.test_order&&<p role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 font-semibold">Test order — do not dispatch.</p>}
    {jobs&&<section className="mt-5 rounded-xl border p-4"><h2 className="font-semibold">Order notifications</h2>{jobs.filter(j=>j.kind!=='royal_mail').map(j=><p key={j.kind} className="mt-2 text-sm">{j.kind==='customer_email'?'Customer email':'Admin email'}: {j.status==='accepted'?'Accepted by email provider (delivery not yet confirmed)':j.status}{j.last_error?` — ${j.last_error}`:''}</p>)}</section>}
    <div className="mt-6 grid gap-5 md:grid-cols-2">{fields.map(group => {
      const entries = group.names.filter(name => Object.prototype.hasOwnProperty.call(order, name));
      return <section key={group.title} className="rounded-2xl border border-soft-black/10 bg-white p-5"><h2 className="font-display text-xl">{group.title}</h2>{entries.length ? <dl className="mt-4 space-y-3">{entries.map(name => <div key={name} className="border-t border-soft-black/10 pt-3"><dt className="text-xs font-semibold uppercase tracking-wide text-soft-black/60">{name.replace(/_/g, " ")}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{shown(order[name])}</dd></div>)}</dl> : <p className="mt-3 text-sm text-soft-black/60">No matching fields recorded.</p>}</section>;
    })}</div>
    <p className="print:hidden mt-6 text-sm"><Link href="/admin/shipping" className="font-semibold underline">Royal Mail shipping setup and status →</Link></p>
    <p className="print:hidden mt-6 text-xs text-soft-black/60">Only recognised fields are shown. Existing database records are not changed by viewing this page.</p>
  </main>;
}
