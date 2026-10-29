import Link from 'next/link';
import RoyalMailConnection from '@/components/admin/royal-mail-connection';
import {supabaseAdmin} from '@/lib/supabase';
export const dynamic='force-dynamic';
export default async function ShippingPage(){
 const configured=!!process.env.ROYAL_MAIL_CLICK_DROP_API_KEY?.trim(),enabled=process.env.BLING_ROYAL_MAIL_IMPORT_ENABLED==='true';
 const {data:orders,error}=await supabaseAdmin.from('bling_paid_orders').select('id,reference,royal_mail_status,royal_mail_order_id,royal_mail_tracking_number')
  .eq('status','paid').eq('payment_environment','live').order('created_at',{ascending:false}).limit(30);
 return <main className="mx-auto max-w-4xl px-4 py-12"><Link href="/admin" className="underline">Back to admin</Link><h1 className="mt-5 text-3xl">Royal Mail Click &amp; Drop</h1>
 <p className="mt-3">Bling orders use the trading name “Bling Beauty Products” on the shared account. The account default trading name and other shops' settings are not changed.</p>
 <section className="mt-6 rounded-xl border p-5"><h2 className="font-semibold">Connection</h2><p className="mt-2">API key configured: {configured?'Yes':'No'}. New order imports enabled: {enabled?'Yes':'No'}.</p><RoyalMailConnection/></section>
 <section className="mt-6 rounded-xl border p-5"><h2 className="font-semibold">Packing and import</h2><p className="mt-2">Open a verified Live paid order, enter its measured packed weight, actual included tax and parcel format, then create the Click &amp; Drop draft. No postage purchase, label request or manifest is submitted by this site.</p><p className="mt-2">Apply postage and print in Click &amp; Drop after checking the sender, address, packed dimensions and service. Use “Check existing import / update tracking” on the order to save the Royal Mail identifier and tracking.</p><p className="mt-2">No automatic import retries follow an uncertain response. Use the existing-order check. Destinations requiring customs information are handled manually.</p></section>
 <section className="mt-6 rounded-xl border p-5"><h2 className="font-semibold">Recent paid orders</h2>{error?<p className="mt-3">Shipping records are unavailable.</p>:orders?.length?<ul className="mt-3 space-y-3">{orders.map(o=><li key={o.id} className="break-all text-sm"><Link className="underline" href={`/admin/orders/${o.id}`}>{o.reference}</Link> — {o.royal_mail_status}{o.royal_mail_order_id?` — Royal Mail ${o.royal_mail_order_id}`:''}{o.royal_mail_tracking_number?` — ${o.royal_mail_tracking_number}`:''}</li>)}</ul>:<p className="mt-3">No verified Live paid orders yet. Test and unpaid orders cannot be imported.</p>}</section></main>;
}
