import Link from "next/link";
export const metadata = { title: 'Privacy policy' + " | Bling Beauty Products", description: 'How Bling Beauty Products uses personal information.' };
export default function Page(){ return (
<main className="min-h-[65vh] bg-[#fffaf6] px-5 py-16"><div className="mx-auto max-w-3xl space-y-6 text-[#45372f]">
<Link href="/policies" className="text-sm underline">Store policies</Link>
<h1 className="font-display text-4xl">Privacy policy</h1>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Who we are</h2>
<p className="mb-3">Bling Beauty Products operates this online store. Contact info@blingbeautyproducts.com about personal data.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Information we collect</h2>
<p className="mb-3">When you place an order or contact us, we may process your name, email address, phone number, delivery address, items ordered, transaction reference and correspondence. Payment card information is handled by our payment service provider rather than collected directly by this website.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Why we use it</h2>
<p className="mb-3">We process order and delivery details to perform our contract with you, retain relevant records to comply with legal obligations, and respond to service enquiries where we have a legitimate interest. Marketing messages require an appropriate legal basis and an unsubscribe option where applicable.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Who receives it</h2>
<p className="mb-3">We use service providers for hosting, payments, order administration, delivery and transactional email. Information is shared only where necessary to provide the service, comply with law or protect legitimate interests.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Retention and international processing</h2>
<p className="mb-3">We retain order and accounting records for periods required by applicable law, and other personal information only as long as necessary for its purpose. For information about where our service providers process your data and the safeguards that apply, contact info@blingbeautyproducts.com.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Your rights</h2>
<p className="mb-3">Subject to applicable law, you can request access, correction, erasure, restriction, portability or object to certain processing. You can complain to the UK Information Commissioner’s Office at ico.org.uk.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Cookies</h2>
<p className="mb-3">Essential cookies may be used to run the shop and maintain a basket or admin session. Any non-essential analytics or advertising cookies require an appropriate consent mechanism before being enabled.</p>
</section>
<section className="rounded-2xl border border-[#e6d7c8] bg-white p-6 leading-7"><h2 className="mb-3 text-xl font-semibold">Contact</h2>
<p className="mb-3">Email info@blingbeautyproducts.com with privacy requests. We may need to verify your identity before responding.</p>
</section>
<p className="text-sm">Questions? Email <a className="underline" href="mailto:info@blingbeautyproducts.com">info@blingbeautyproducts.com</a>.</p>
</div></main>); }
