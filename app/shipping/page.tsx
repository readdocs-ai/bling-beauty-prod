import Link from "next/link";
export const metadata = { title: 'Delivery information' + " | Bling Beauty Products", description: 'UK delivery information for Bling Beauty Products.' };
export default function Page(){ return (
<main className="min-h-[65vh] bg-[#fffaf6] px-5 py-16"><div className="mx-auto max-w-3xl space-y-6 text-[#45372f]">
<Link href="/policies" className="text-sm underline">Store policies</Link>
<h1 className="font-display text-4xl">Delivery information</h1>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Delivery area</h2>
<p className="mb-3">Our current checkout is configured for addresses in the United Kingdom. Please contact us before ordering if you need delivery outside the UK.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Delivery charges</h2>
<p className="mb-3">The store currently advertises free UK delivery. Confirm that this matches the final checkout pricing before launch.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Dispatch and delivery times</h2>
<p className="mb-3">Delivery estimates must be confirmed against the fulfilment service before launch. We will provide available tracking or dispatch updates where supported.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Delivery problems</h2>
<p className="mb-3">If a parcel is delayed, damaged or missing, contact info@blingbeautyproducts.com with your order reference. Your statutory rights remain unaffected.</p>
</section>
<p className="text-sm">Questions? Email <a className="underline" href="mailto:info@blingbeautyproducts.com">info@blingbeautyproducts.com</a>.</p>
</div></main>); }
