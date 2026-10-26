import Link from 'next/link';
import {supabaseAdmin} from '@/lib/supabase';
import SettlementRecovery from '@/components/admin/settlement-recovery';
export const dynamic='force-dynamic';
export default async function CheckoutOperations(){
 const [events,jobs,settings]=await Promise.all([
  supabaseAdmin.from('bling_worldpay_settlement_events').select('event_id,environment,reference,status,received_at').order('received_at',{ascending:false}).limit(30),
  supabaseAdmin.from('bling_paid_order_jobs').select('order_id,kind,status,last_error').in('kind',['customer_email','admin_email']).limit(60),
  supabaseAdmin.from('store_settings').select('orders_suspended').eq('id',1).maybeSingle(),
 ]);
 const checks=[['Live ordering suspended',settings.data?.orders_suspended===true],['Worldpay event signatures configured',!!process.env.WORLDPAY_EVENT_SIGNING_KEYS],
  ['Preview settlement processing enabled',process.env.BLING_PREVIEW_SETTLEMENT_EVENTS==='true'],['Resend configured',!!process.env.RESEND_API_KEY],
  ['Order email delivery enabled',process.env.BLING_ORDER_EMAILS_ENABLED==='true'],['Test recipient list configured',!!process.env.BLING_TEST_EMAIL_RECIPIENTS]] as const;
 return <main className="mx-auto max-w-5xl px-4 py-12"><Link href="/admin" className="underline">Back to admin</Link><h1 className="mt-5 text-3xl">Checkout operations</h1>
 <p className="mt-3">Current environment: {process.env.WORLDPAY_ENVIRONMENT??'Not configured'}. Configuration checks alone do not confirm a successful payment or email delivery.</p>
 <ul className="mt-5 space-y-2">{checks.map(([label,ok])=><li key={label}>{label}: <strong>{ok?'Yes':'No'}</strong></li>)}</ul>
 <div className="mt-6 flex gap-5"><Link className="underline" href="/admin/email-preview">Email previews</Link><Link className="underline" href="/admin/email-test">Send a test email</Link><Link className="underline" href="/admin/orders">Customer orders</Link></div>
 <section className="mt-8 rounded-xl border p-5"><h2 className="mb-4 text-xl">Payment notification recovery</h2><SettlementRecovery/>
 {events.error?<p className="mt-4">Notification inbox unavailable. Check the database migration.</p>:<ul className="mt-4 space-y-2">{events.data?.map(e=><li key={`${e.environment}/${e.event_id}`} className="break-all text-sm">{e.environment==='try'?'TEST':'LIVE'} — {e.reference}: {e.status}</li>)}</ul>}</section>
 <section className="mt-8 rounded-xl border p-5"><h2 className="text-xl">Recent email jobs</h2><p className="mt-2 text-sm">Accepted means the email provider accepted the request; it does not confirm inbox delivery. A job stuck at “sending” must be reviewed before any retry.</p>
 {jobs.error?<p className="mt-4">Email queue unavailable.</p>:<ul className="mt-4 space-y-2">{jobs.data?.map(j=><li key={`${j.order_id}/${j.kind}`} className="text-sm"><Link className="underline" href={`/admin/orders/${j.order_id}`}>View order</Link> — {j.kind==='customer_email'?'Customer':'Admin'}: {j.status}{j.last_error?` — ${j.last_error}`:''}</li>)}</ul>}</section>
 </main>;
}
