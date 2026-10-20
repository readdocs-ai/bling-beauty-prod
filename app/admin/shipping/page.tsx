import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ShippingPage() {
  // The working Peptide Products integration uses Click & Drop, not the
  // separate Royal Mail Shipping API OAuth client-id/client-secret scheme.
  const clickDropConfigured = Boolean(process.env.ROYAL_MAIL_CLICK_DROP_API_KEY?.trim());
  return <main className="mx-auto max-w-4xl px-4 py-12">
    <Link href="/admin" className="text-sm underline">← Admin dashboard</Link>
    <h1 className="mt-5 font-display text-4xl">Royal Mail Click &amp; Drop</h1>
    <p className="mt-3 text-soft-black/70">Bling Beauty will initially share the existing Royal Mail Click &amp; Drop business account used by Peptide Products. Shipping references must remain separate for each shop, and the sender details must be checked before any real labels are purchased.</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-soft-black/10 bg-white p-5"><h2 className="font-semibold">Click &amp; Drop API key</h2><p className="mt-2 text-sm">{clickDropConfigured ? "A server-side API key is configured. Connectivity and account permissions have not yet been verified." : "Not configured for Bling Beauty. The key must be entered securely in the Bling Beauty hosting environment."}</p></section>
      <section className="rounded-2xl border border-soft-black/10 bg-white p-5"><h2 className="font-semibold">Account migration</h2><p className="mt-2 text-sm">Initially use the existing account; later replace the key with the new account's authorised key. Keep previously issued tracking and label references unchanged.</p></section>
    </div>
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><h2 className="font-semibold">Live label creation remains disabled</h2><p className="mt-2">We have identified the working Click &amp; Drop API approach from the Peptide Products source. Bling Beauty uses a different order database, so label creation must not be enabled until address mapping, verified payment, unique order references, duplicate prevention and tracking persistence are tested.</p></section>
    <section className="mt-6 rounded-2xl border border-soft-black/10 bg-white p-5 text-sm"><h2 className="font-semibold">Dispatch workflow</h2><p className="mt-2">Verified paid order → validate delivery address → send a uniquely prefixed Bling Beauty reference to Click &amp; Drop → confirm no previous Royal Mail order exists → save the Royal Mail identifier → apply postage and print label → save tracking → send dispatch notification.</p></section>
  </main>;
}
