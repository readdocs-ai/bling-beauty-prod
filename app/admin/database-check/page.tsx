import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function DatabaseCheckPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let result: 'not-configured' | 'connected' | 'error' = 'not-configured';
  let fields: string[] = [];
  if (url && key) {
    try {
      const client = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await client.from('orders').select('*').limit(1);
      if (error) result = 'error';
      else {
        result = 'connected';
        fields = data?.[0] ? Object.keys(data[0]).sort() : [];
      }
    } catch {
      result = 'error';
    }
  }
  return <main className="mx-auto max-w-3xl px-4 py-12">
    <Link href="/admin/readiness" className="text-sm underline">← Launch readiness</Link>
    <h1 className="mt-5 font-display text-4xl">Orders database check</h1>
    <p className="mt-3 text-sm text-soft-black/70">Read-only check of the Supabase orders table. No customer values, passwords, keys or connection strings are displayed or changed.</p>
    <section className="mt-6 rounded-2xl border bg-white p-6">
      <h2 className="font-semibold">Connection result</h2>
      <p className="mt-2">{result === 'connected' ? 'Connected: the orders table responded successfully.' : result === 'not-configured' ? 'Not configured: Supabase URL or server key is missing.' : 'Could not read the orders table. Check the server configuration, database availability and table permissions.'}</p>
      {result === 'connected' && <><h3 className="mt-5 font-semibold">Observed column names</h3>{fields.length ? <p className="mt-2 break-words text-sm text-soft-black/70">{fields.join(', ')}</p> : <p className="mt-2 text-sm text-soft-black/70">The table returned no records, so its columns cannot be inferred from this check.</p>}</>}
    </section>
    <p className="mt-5 text-sm text-soft-black/70">This check does not verify the full schema, historical records, payment accuracy or email delivery. It must only be used by an authorised administrator.</p>
  </main>;
}
