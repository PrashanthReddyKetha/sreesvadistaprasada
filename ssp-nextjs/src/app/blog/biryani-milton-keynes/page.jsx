import Link from 'next/link';

const SITE = 'https://sreesvadistaprasada.com';
const HERO = 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80';

export const metadata = {
  title: { absolute: 'Biryani in Milton Keynes — The Andhra Way | Sree Svadista Prasada' },
  description: 'Andhra-style chicken biryani in Milton Keynes from £8.99 — dum biryani, fry piece biryani, and the spiced rice plates that sit beside them. Order online.',
  alternates: { canonical: `${SITE}/blog/biryani-milton-keynes` },
  openGraph: {
    title: 'Biryani in Milton Keynes — The Andhra Way',
    description: 'What makes Andhra biryani different, and a guide to every biryani and spiced rice we cook in Milton Keynes.',
    type: 'article',
    url: `${SITE}/blog/biryani-milton-keynes`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: HERO, width: 1200, height: 630, alt: 'Andhra chicken biryani in Milton Keynes' }],
  },
  twitter: { card: 'summary_large_image', title: 'Biryani in Milton Keynes — The Andhra Way', images: [HERO] },
};

// Live menu items only — names, prices and slugs verified against the API
const BIRYANIS = [
  { name: 'Chicken Biryani', price: '£8.99', slug: '/svadista/biriyani/chicken-biryani', note: 'The everyday order — spiced basmati and tender chicken, cooked the Andhra home way.' },
  { name: 'Chicken Dum Biryani', price: '£10.99', slug: '/svadista/biriyani/chicken-dum-biryani', note: 'Sealed and slow-finished on dum so the rice steams in the masala — deeper, layered flavour.' },
  { name: 'Chicken Fry Piece Biryani', price: '£10.99', slug: '/svadista/biriyani/chicken-fry-piece-biryani', note: 'Crisp-fried marinated chicken folded through the rice — the Andhra street favourite.' },
];

const VEG_RICE = [
  { name: 'Gongura Rice', price: '£7.99', slug: '/prasada/biriyanis-rice/gongura-rice' },
  { name: 'Ghee Pappu Avakaya Rice', price: '£7.99', slug: '/prasada/biriyanis-rice/ghee-pappu-avakaya-rice' },
  { name: 'Sambar Rice', price: '£6.99', slug: '/prasada/biriyanis-rice/sambar-rice' },
  { name: 'Tomato Rice', price: '£5.99', slug: '/prasada/biriyanis-rice/tomato-rice' },
  { name: 'Jeera Rice', price: '£4.99', slug: '/prasada/biriyanis-rice/jeera-rice' },
];

const FAQS = [
  { q: 'Where can I get chicken biryani in Milton Keynes?', a: 'Sree Svadista Prasada cooks three Andhra-style chicken biryanis fresh to order in Greenleys — Chicken Biryani (£8.99), Chicken Dum Biryani (£10.99) and Chicken Fry Piece Biryani (£10.99) — with delivery across all MK postcodes and collection with 10% off.' },
  { q: 'What is the difference between dum biryani and regular biryani?', a: 'Dum biryani is sealed and finished over low heat so the part-cooked rice steams in the meat and masala, layering the flavour through every grain. A regular biryani is cooked more directly. Fry piece biryani takes a third route: the chicken is marinated and crisp-fried, then folded through the spiced rice.' },
  { q: 'How is Andhra biryani different from Hyderabadi biryani?', a: 'They are close cousins — both from Telugu-speaking South India. Andhra-style biryani generally runs hotter, leaning on Guntur chilli and home-style masala rather than the courtly, saffron-forward Hyderabadi dum tradition. Ours follows the Andhra home kitchen.' },
  { q: 'Is there a vegetarian biryani option?', a: 'Our pure-veg Prasada kitchen makes traditional Andhra spiced rice dishes instead — Gongura Rice, Ghee Pappu Avakaya Rice, Sambar Rice and more, from £4.99. They are cooked in a dedicated vegetarian kitchen.' },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Biryani in Milton Keynes — The Andhra Way',
    description: 'A guide to the Andhra-style biryanis and traditional spiced rice dishes cooked fresh at Sree Svadista Prasada in Milton Keynes.',
    author: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE },
    publisher: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
    datePublished: '2026-09-13',
    dateModified: '2026-09-13',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/biryani-milton-keynes` },
    image: HERO,
    articleSection: 'Food Guide',
    about: { '@type': 'Thing', name: 'Biryani', alternateName: ['Biriyani', 'Dum biryani'] },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Biryani in Milton Keynes', item: `${SITE}/blog/biryani-milton-keynes` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];

export default function BiryaniGuide() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-amber-50">
        <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <nav className="text-amber-300 text-sm mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span className="mx-2">/</span>
              <span className="text-white">Biryani in Milton Keynes</span>
            </nav>
            <span className="text-xs font-semibold text-amber-300 bg-amber-900/50 px-3 py-1 rounded-full uppercase tracking-wider">Food Guide</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4 leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              Biryani in Milton Keynes — The Andhra Way
            </h1>
            <p className="text-amber-200 text-lg">5 min read &middot; Sree Svadista Prasada</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-6 py-12 prose prose-lg prose-amber">
          <p className="lead">
            Most biryani in Britain descends from the Mughlai north — creamy, saffron-scented, gently spiced. Andhra biryani is a different animal: hotter, more rustic, built on Guntur chilli and home-style masala rather than courtly restraint. If you have only ever had takeaway biryani from a curry-house menu, the Andhra version is worth crossing town for.
          </p>

          <h2>The three biryanis we cook</h2>
          <ul>
            {BIRYANIS.map(b => (
              <li key={b.slug}>
                <strong><Link href={b.slug}>{b.name}</Link> — {b.price}.</strong> {b.note}
              </li>
            ))}
          </ul>
          <p>
            All three are cooked fresh to order in our Greenleys kitchen — nothing sits in a bain-marie waiting for you.
          </p>

          <h2>From the pure-veg kitchen</h2>
          <p>
            Traditional Andhra spiced rice plates come from our dedicated vegetarian Prasada kitchen:
          </p>
          <ul>
            {VEG_RICE.map(v => (
              <li key={v.slug}><Link href={v.slug}>{v.name}</Link> — {v.price}</li>
            ))}
          </ul>
          <p>
            Gongura Rice deserves a special mention — the tangy sorrel leaf is Andhra&rsquo;s signature ingredient.{' '}
            <Link href="/gongura">Read the gongura guide</Link> if it&rsquo;s new to you.
          </p>

          <h2>Ordering in Milton Keynes</h2>
          <p>
            Order from the <Link href="/svadista/biriyani">biryani menu</Link> for{' '}
            <Link href="/delivery">delivery across all MK postcodes</Link> in 30–60 minutes, or collect from Greenleys and save 10%. Spice levels are marked on every dish page — and yes, you can ask for milder in the order notes.
          </p>

          <h2>Your questions</h2>
          {FAQS.map(({ q, a }) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}

          <p>
            <Link href="/order">Order biryani now</Link> — or explore the full <Link href="/menu">170-dish menu</Link>.
          </p>
        </article>
      </main>
    </>
  );
}
