import Link from "next/link";
export const metadata = { title: 'Returns and refunds' + " | Bling Beauty Products", description: 'Returns, cancellations and refunds for UK beauty orders.' };
export default function Page(){ return (
<main className="min-h-[65vh] bg-[#fffaf6] px-5 py-16"><div className="mx-auto max-w-3xl space-y-6 text-[#45372f]">
<Link href="/policies" className="text-sm underline">Store policies</Link>
<h1 className="font-display text-4xl">Returns and refunds</h1>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Changed your mind</h2>
<p className="mb-3">For most online consumer purchases, you can tell us you wish to cancel within 14 days of receiving the goods. You then normally have a further 14 days to return them. Please email us before returning anything so we can provide return instructions.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Hygiene-sealed products</h2>
<p className="mb-3">Where goods are sealed for health protection or hygiene reasons, the legal cancellation right may not apply after you break the seal. This exception does not remove your rights where goods are faulty or not as described.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Refunds</h2>
<p className="mb-3">Where the statutory cancellation right applies, we will refund the eligible product price and standard outbound delivery charge, if paid. We may wait until we receive the returned goods or evidence that they have been sent back. Refunds are normally made to the original payment method within 14 days of that point.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Return postage and care</h2>
<p className="mb-3">Unless we agree otherwise or the goods are faulty, you are generally responsible for return postage on change-of-mind returns. Please package goods securely; a deduction may apply for handling beyond what is necessary to establish their nature, characteristics and functioning.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Faulty, damaged or incorrect items</h2>
<p className="mb-3">Contact us promptly with your order reference and a description of the problem. Your statutory rights under the Consumer Rights Act 2015 are unaffected. We will arrange an appropriate remedy, including return costs where legally required.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">How to request a return</h2>
<p className="mb-3">Email info@blingbeautyproducts.com with your order reference, the items concerned and whether you are cancelling or reporting a fault. Please do not post items without obtaining return instructions.</p>
</section>
<p className="text-sm">Questions? Email <a className="underline" href="mailto:info@blingbeautyproducts.com">info@blingbeautyproducts.com</a>.</p>
</div></main>); }
