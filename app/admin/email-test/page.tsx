'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function EmailTestPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  async function test() {
    setBusy(true); setResult('');
    try {
      const response = await fetch('/admin/api/email-test', { method: 'POST', credentials: 'same-origin' });
      const data = await response.json();
      setResult(response.ok ? `${data.message} Reference: ${data.providerMessageId}` : data.error || 'Test failed.');
    } catch { setResult('Unable to reach the test endpoint.'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-2xl px-4 py-12">
    <Link href="/admin" className="underline">Back to admin</Link>
    <h1 className="mt-6 text-3xl font-semibold">Transactional email test</h1>
    <p className="mt-4">This sends one clearly labelled test notification to info@blingbeautyproducts.com through Resend. It creates no orders and takes no payment. Available only on a Vercel Preview deployment.</p>
    <button type="button" disabled={busy} onClick={test} className="mt-6 rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50">{busy ? 'Sending...' : 'Send test email'}</button>
    {result && <p role="status" className="mt-5 rounded-lg border p-4">{result}</p>}
  </main>;
}
