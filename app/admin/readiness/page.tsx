import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Check = { label: string; ready: boolean; detail: string };
export default function ReadinessPage() {
  const checks: Check[] = [
    { label: 'Supabase URL', ready: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), detail: 'Required for product and order records.' },
    { label: 'Supabase public key', ready: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), detail: 'Used for public catalogue access.' },
    { label: 'Supabase server key', ready: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), detail: 'Required for authorised server-side admin operations.' },
    { label: 'Admin username', ready: Boolean(process.env.ADMIN_USERNAME), detail: 'Required for protected admin login.' },
    { label: 'Admin password', ready: Boolean(process.env.ADMIN_PASSWORD), detail: 'Required for protected admin login.' },
  ];
  return <main className="mx-auto max-w-4xl px-4 py-12">
    <Link href="/admin" className="text-sm underline">← Admin dashboard</Link>
    <h1 className="mt-5 font-display text-4xl">Launch readiness</h1>
    <p className="mt-3 text-soft-black/70">Configuration presence only. No passwords, API keys or tokens are displayed. A green result does not prove the service works.</p>
    <div className="mt-7 space-y-3">{checks.map(check => <div key={check.label} className="flex items-start justify-between gap-4 rounded-2xl border border-soft-black/10 bg-white p-5"><div><h2 className="font-semibold">{check.label}</h2><p className="mt-1 text-sm text-soft-black/60">{check.detail}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${check.ready ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}`}>{check.ready ? 'Configured' : 'Missing'}</span></div>)}</div>
    <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><h2 className="font-semibold">Payment launch is blocked</h2><p className="mt-2">Worldpay is not yet live-enabled. Checkout deliberately returns unavailable; no card details or payment attempts are accepted. Do not mark orders paid based on a browser return page.</p></section>
    <p className="mt-4"><Link href="/admin/shipping" className="font-semibold underline">Review Royal Mail shipping readiness →</Link></p>
    <p className="mt-4"><Link href="/admin/database-check" className="font-semibold underline">Run read-only orders database check →</Link></p>
    <section className="mt-4 rounded-2xl border border-soft-black/10 bg-white p-5 text-sm"><h2 className="font-semibold">Further checks still required</h2><p className="mt-2">Verify the actual orders table, configure a transactional email provider and domain authentication, implement a server-side Worldpay test flow with verified notifications, then run end-to-end tests and a production build. Email templates are previews only.</p></section>
  </main>;
}
