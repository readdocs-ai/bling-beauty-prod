import Link from 'next/link';
import { listProducts } from '@/lib/products';
import { luxuryItems } from '@/lib/luxury-catalogue';

export const dynamic = 'force-dynamic';

/** Read-only audit: no external images are hotlinked or misrepresented as approved. */
export default async function ProductImagesPage() {
  let products: Awaited<ReturnType<typeof listProducts>> = [];
  let databaseError = false;
  try { products = await listProducts(); } catch { databaseError = true; }
  const bySlug = new Map(products.map(p => [p.slug, p]));
  return <main className="mx-auto max-w-5xl px-4 py-12">
    <Link href="/admin" className="underline text-sm">← Admin dashboard</Link>
    <h1 className="mt-6 font-display text-4xl">Luxury product photographs</h1>
    <p className="mt-3 text-sm">Read-only launch audit. Each product requires an approved, exact-edition hero photograph and ideally additional gallery photographs. An empty gallery is not launch-ready.</p>
    {databaseError && <p className="mt-5 rounded-lg bg-amber-100 p-4">The product database could not be read. Image readiness cannot be confirmed.</p>}
    <div className="mt-8 space-y-4">{luxuryItems.map(item => {
      const product = bySlug.get(item.slug);
      const images = product?.images?.filter(Boolean) ?? [];
      return <section key={item.slug} className="rounded-xl border p-5 bg-white">
        <div className="flex justify-between gap-4"><div><h2 className="font-semibold">{item.brand} — {item.name}</h2><p className="text-xs mt-1">{item.slug}</p></div><strong className="text-sm">{!product ? 'Not found in database' : images.length ? `${images.length} image(s) listed — verify` : 'Photographs missing'}</strong></div>
        {images.length > 0 && <ul className="mt-3 text-xs break-all">{images.map((src, i) => <li key={`${src}-${i}`}>{src}</li>)}</ul>}
      </section>;
    })}</div>
    <p className="mt-6 text-sm">This audit checks image references, not copyright permission, visual accuracy, file availability, or whether an image matches the precise set sold.</p>
  </main>;
}
