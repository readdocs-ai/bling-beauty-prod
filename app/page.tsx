import Link from "next/link";
import { luxuryItems } from "@/lib/luxury-catalogue";
import { LuxuryTile } from "@/components/luxury/luxury-tile";

export const metadata = {
  title: "Luxury Skincare & Beautiful Gifting | Bling Beauty Products",
  description: "Explore the Bling Beauty boutique: thoughtfully curated skincare, elegant gift ideas and a fresh approach to everyday beauty.",
};

export default async function HomePage() {
  return <main className="bb-home">
    <section className="bb-hero">
      <div className="bb-hero-inner">
        <div className="bb-hero-copy">
          <div className="bb-overline"><span className="bb-sparkle">✦</span> THE BLING BEAUTY BOUTIQUE</div>
          <h1>Your daily dose<br/>of <em>beautiful.</em></h1>
          <p>Discover a brighter way to shop skincare. Considered beauty essentials, indulgent rituals and gifting worth getting excited about.</p>
          <div className="bb-hero-actions"><Link className="bb-cta" href="/shop">Explore the boutique <span aria-hidden="true">↗</span></Link><Link className="bb-quiet-link" href="/about">Meet Bling Beauty <span aria-hidden="true">→</span></Link></div>
          <div className="bb-hero-note"><span>✧</span> A little everyday luxury, beautifully chosen.</div>
        </div>
        <div className="bb-hero-art" aria-label="Abstract decorative beauty illustration">
          <div className="bb-art-halo"/><div className="bb-art-sun"/><div className="bb-art-bottle bb-art-bottle-back"><span>BLING<br/>BEAUTY</span></div><div className="bb-art-bottle bb-art-bottle-front"><span className="bb-bottle-mark">B.</span><span>THE BEAUTY EDIT</span></div><div className="bb-art-orb"/><div className="bb-art-sticker">GLOW<br/><em>your way</em></div>
        </div>
      </div>
      <div className="bb-hero-bottom">SKINCARE <span>✦</span> BEAUTY RITUALS <span>✦</span> GIFTING <span>✦</span> EVERYDAY LUXURY</div>
    </section>

    <section className="bb-intro bb-wrap"><div><div className="bb-overline">CURATED WITH CARE</div><h2>Good skin days start <em>here.</em></h2></div><p>Whether you are refreshing your routine or choosing something special, find beauty that feels personal, joyful and effortlessly luxurious.</p></section>

    <section className="bb-category-wrap bb-wrap" aria-label="Shop by interest">
      <Link href="/shop" className="bb-category bb-category-peach"><span className="bb-category-symbol">✳</span><span><small>01 / DISCOVER</small><strong>Skincare favourites</strong><span>Explore the edit ↗</span></span></Link>
      <Link href="/shop" className="bb-category bb-category-lilac"><span className="bb-category-symbol">✿</span><span><small>02 / INDULGE</small><strong>Feel-good rituals</strong><span>Find your moment ↗</span></span></Link>
      <Link href="/shop" className="bb-category bb-category-lemon"><span className="bb-category-symbol">✧</span><span><small>03 / CELEBRATE</small><strong>Beautiful gifting</strong><span>Shop thoughtful treats ↗</span></span></Link>
    </section>

    <section className="bb-products bb-wrap"><div className="bb-section-heading"><div><div className="bb-overline">THE BOUTIQUE EDIT</div><h2>Something to <em>love.</em></h2><p>Explore the latest additions to the Bling Beauty collection.</p></div><Link href="/shop" className="bb-view-all">View the full shop ↗</Link></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{luxuryItems.map(item=><LuxuryTile key={item.slug} item={item}/>)}</div>

    </section>

    <section className="bb-story"><div className="bb-wrap bb-story-grid"><div className="bb-story-art"><span className="bb-story-big">B</span><span className="bb-story-flower">✺</span><span className="bb-story-caption">BEAUTY LOOKS GOOD ON YOU</span></div><div className="bb-story-copy"><div className="bb-overline">A NOTE FROM BLING BEAUTY</div><h2>Luxury should feel <em>lovely.</em><br/>Not complicated.</h2><p>We believe your beauty routine should be one of the best parts of your day. Thoughtful products, delightful details and an easy, welcoming shopping experience — that's the Bling Beauty way.</p><Link className="bb-cta" href="/about">Our story ↗</Link></div></div></section>

    <section className="bb-contact-strip bb-wrap"><div><div className="bb-overline">HERE TO HELP</div><h2>Need a little beauty advice?</h2><p>Questions about the collection or your order? Our team is just a message away.</p></div><div className="bb-contact-actions"><a className="bb-cta" href="https://wa.me/447429098887" target="_blank" rel="noopener noreferrer">Chat on WhatsApp ↗</a><a className="bb-quiet-link" href="mailto:info@blingbeautyproducts.com">Email our team →</a></div></section>
  </main>;
}
