export const dynamic = "force-dynamic";
export async function GET() {
  // No products are advertised until verified feed data and images are available.
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Bling Beauty Products</title><link>https://blingbeautyproducts.com</link><description>Prestige skincare collections</description></channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
