import Link from 'next/link';
import { buildEmail, type EmailKind } from '@/lib/email/templates';
export const dynamic = 'force-dynamic';
const example = { reference: 'DEMO-1001', customerName: 'Alex', customerEmail: 'customer@example.com', totalGBP: 150, items: [{ name: 'Luxury Skincare Gift Set', quantity: 1 }] };
const labels: { kind: EmailKind; label: string; condition: string }[] = [
  { kind: 'order-received', label: 'Order received', condition: 'After a genuine order is saved; payment not yet confirmed' },
  { kind: 'payment-confirmed', label: 'Payment confirmed', condition: 'Only after verified server-side payment confirmation' },
  { kind: 'dispatched', label: 'Dispatched', condition: 'Only after a member of staff records dispatch' },
  { kind: 'admin-alert', label: 'New order alert', condition: 'After a genuine order is saved' },
];
export default function EmailPreviewPage() {
  return <main className="mx-auto max-w-5xl px-4 py-12">
    <Link href="/admin" className="text-sm underline">← Admin dashboard</Link>
    <h1 className="mt-4 font-display text-4xl">Order email previews</h1>
    <p className="mt-3 text-sm text-soft-black/70">Preview-only templates. No messages are sent, no orders are created and no payment statuses are changed. The sample details below are fictional.</p>
    <div className="mt-8 grid gap-5">{labels.map(({ kind, label, condition }) => { const draft = buildEmail(kind, example); return <section key={kind} className="rounded-2xl border border-soft-black/10 bg-white p-6 shadow-soft"><h2 className="font-display text-2xl">{label}</h2><p className="mt-1 text-xs text-soft-black/60">Send condition: {condition}</p><div className="mt-4 text-sm"><p><strong>To:</strong> {draft.recipient}</p><p className="mt-1"><strong>Subject:</strong> {draft.subject}</p></div><pre className="mt-4 whitespace-pre-wrap rounded-xl bg-rose-50/50 p-4 font-sans text-sm leading-6">{draft.text}</pre></section>; })}</div>
    <p className="mt-6 text-sm text-soft-black/70">To activate delivery later, verify the sending domain, select an email provider, confirm the Supabase order schema and implement idempotent, audited email triggers.</p>
  </main>;
}
