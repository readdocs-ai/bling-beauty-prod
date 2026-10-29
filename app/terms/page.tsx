import Link from "next/link";
export const metadata = { title: 'Terms and conditions' + " | Bling Beauty Products", description: 'Information about ordering from Bling Beauty Products.' };
export default function Page(){ return (
<main className="min-h-[65vh] bg-[#fffaf6] px-5 py-16"><div className="mx-auto max-w-3xl space-y-6 text-[#45372f]">
<Link href="/policies" className="text-sm underline">Store policies</Link>
<h1 className="font-display text-4xl">Terms and conditions</h1>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">About these terms</h2>
<p className="mb-3">These terms apply to purchases from Bling Beauty Products through this website. Contact us before ordering if you need clarification.</p>
<p className="mb-3">For questions about our business, products or these terms, email info@blingbeautyproducts.com.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Products and prices</h2>
<p className="mb-3">Product descriptions and prices are shown in pounds sterling. Availability may change. We may decline an order where a product is unavailable or a price is clearly incorrect, and will refund any payment taken for an unfulfilled order.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Orders and payment</h2>
<p className="mb-3">Submitting an order is an offer to buy. An order is accepted when we confirm acceptance. Payment must be completed using the checkout methods displayed on the website. Do not send payment details by email or WhatsApp.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Delivery and returns</h2>
<p className="mb-3">UK delivery information is on our shipping page. Your statutory rights remain unaffected. Please read our returns policy for cancellation, hygiene-sealed goods and faulty items.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Consumer rights</h2>
<p className="mb-3">Nothing in these terms excludes or limits rights that cannot legally be excluded, including rights under the Consumer Rights Act 2015.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Contact</h2>
<p className="mb-3">For order queries or complaints, email info@blingbeautyproducts.com.</p>
</section>
<p className="text-sm">Questions? Email <a className="underline" href="mailto:info@blingbeautyproducts.com">info@blingbeautyproducts.com</a>.</p>
</div></main>); }
