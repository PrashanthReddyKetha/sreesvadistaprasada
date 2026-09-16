import Link from 'next/link';

const SITE = 'https://sreesvadistaprasada.com';
const HERO = 'https://images.unsplash.com/photo-1742281258189-3b933879867a?w=1200&q=80';

export const metadata = {
  title: { absolute: 'Dosa in Milton Keynes — A Guide to Every Dosa We Make | Sree Svadista Prasada' },
  description: 'Where to get proper dosa in Milton Keynes: 12 varieties from plain and ghee to Nellore karam, made from traditionally fermented batter. From £4.99.',
  alternates: { canonical: `${SITE}/blog/dosa-milton-keynes` },
  openGraph: {
    title: 'Dosa in Milton Keynes — A Guide to Every Dosa We Make',
    description: 'Twelve dosa varieties, one traditionally fermented batter. What makes a real dosa, and how to choose yours in Milton Keynes.',
    type: 'article',
    url: `${SITE}/blog/dosa-milton-keynes`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: HERO, width: 1200, height: 630, alt: 'Crispy South Indian dosa in Milton Keynes' }],
  },
  twitter: { card: 'summary_large_image', title: 'Dosa in Milton Keynes — A Guide to Every Dosa We Make', images: [HERO] },
};

// Live menu items only — names, prices and slugs verified against the API
const DOSAS = [
  { name: 'Plain Dosa (2 pcs)', price: '£4.99', slug: '/breakfast/dosas/plain-dosa-2-pcs', note: 'The benchmark. Thin, golden, crisp at the edges — the one to judge any South Indian kitchen by.' },
  { name: 'Ghee Dosa (2 pcs)', price: '£5.99', slug: '/breakfast/dosas/ghee-dosa-2-pcs', note: 'The same batter finished with ghee for a deeper, nuttier crispness.' },
  { name: 'Butter Dosa (2 pcs)', price: '£5.99', slug: '/breakfast/dosas/butter-dosa-2-pcs', note: 'Softer and richer — a favourite with children.' },
  { name: 'Upma Dosa', price: '£5.99', slug: '/breakfast/dosas/upma-dosa', note: 'A dosa carrying a layer of savoury semolina upma — two tiffin classics in one.' },
  { name: 'Masala Dosa (2 pcs)', price: '£6.99', slug: '/breakfast/dosas/masala-dosa', note: 'Filled with mild spiced potato masala — the world’s most famous dosa.' },
  { name: 'Onion Dosa', price: '£6.99', slug: '/breakfast/dosas/onion-dosa', note: 'Chopped onion pressed into the batter as it cooks, caramelising on the tawa.' },
  { name: 'Nellore Ghee Karam Dosa (2 pcs)', price: '£6.99', slug: '/breakfast/dosas/nellore-ghee-karam-dosa-2-pcs', note: 'The Andhra one. Spread with fiery Nellore-style chilli karam and ghee — order it if you like heat.' },
  { name: 'Carrot Dosa (2 pcs)', price: '£6.99', slug: '/breakfast/dosas/carrot-dosa-2-pcs', note: 'Grated carrot for gentle sweetness and colour.' },
  { name: 'Beetroot Dosa (2 pcs)', price: '£6.99', slug: '/breakfast/dosas/beetroot-dosa-2-pcs', note: 'Earthy, vivid pink, and milder than it looks.' },
  { name: 'Cheese Dosa', price: '£6.99', slug: '/breakfast/dosas/cheese-dosa', note: 'Melted cheese inside a crisp shell — the crossover order.' },
  { name: 'Paneer Dosa', price: '£6.99', slug: '/breakfast/dosas/paneer-dosa', note: 'Spiced crumbled paneer filling for something more substantial.' },
  { name: 'Egg Dosa (2 pcs)', price: '£8.99', slug: '/svadista/egg-specials/egg-dosa-2pcs', note: 'An egg cracked and spread over the cooking dosa — a street-side classic.' },
];

const FAQS = [
  { q: 'Where can I get dosa in Milton Keynes?', a: 'Sree Svadista Prasada makes twelve dosa varieties fresh to order in our Greenleys kitchen, from Plain Dosa at £4.99 to the Andhra-style Nellore Ghee Karam Dosa. Order online for collection or delivery across all MK postcodes.' },
  { q: 'What is a dosa made of?', a: 'A traditional dosa batter is rice and urad dal (black gram), soaked, ground and naturally fermented overnight. The fermentation gives dosa its tang and lace-crisp texture — we never use instant mixes.' },
  { q: 'What is the difference between a masala dosa and a plain dosa?', a: 'A plain dosa is the crisp fermented crepe on its own, served with sambar and chutneys. A masala dosa folds a mildly spiced potato filling inside. Both come with the same accompaniments.' },
  { q: 'How spicy is a karam dosa?', a: 'Karam is a chilli-garlic paste from Andhra Pradesh, and our Nellore Ghee Karam Dosa is genuinely hot — the ghee tempers it, but order a plain or ghee dosa if you prefer mild.' },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Dosa in Milton Keynes — A Guide to Every Dosa We Make',
    description: 'A guide to the twelve dosa varieties made fresh at Sree Svadista Prasada in Milton Keynes, and what makes a traditionally fermented dosa different.',
    author: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE },
    publisher: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
    datePublished: '2026-09-13',
    dateModified: '2026-09-13',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/dosa-milton-keynes` },
    image: HERO,
    articleSection: 'Food Guide',
    about: { '@type': 'Thing', name: 'Dosa', alternateName: ['Dosai', 'Dose'] },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Dosa in Milton Keynes', item: `${SITE}/blog/dosa-milton-keynes` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];

export default function DosaGuide() {
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
              <span className="text-white">Dosa in Milton Keynes</span>
            </nav>
            <span className="text-xs font-semibold text-amber-300 bg-amber-900/50 px-3 py-1 rounded-full uppercase tracking-wider">Food Guide</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4 leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              Dosa in Milton Keynes — A Guide to Every Dosa We Make
            </h1>
            <p className="text-amber-200 text-lg">6 min read &middot; Sree Svadista Prasada</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-6 py-12 prose prose-lg prose-amber">
          <p className="lead">
            A proper dosa is not a pancake. It is a fermented rice-and-lentil crepe, cooked on a screaming-hot tawa until the edges shatter and the centre stays tender — and getting it right takes a batter that has been soaked, ground and left to ferment overnight, not scooped from a packet.
          </p>
          <p>
            In our Greenleys kitchen we make one batter the traditional way and turn it into twelve different dosas, from the £4.99 plain benchmark to the chilli-and-ghee Nellore karam that Andhra people cross towns for. Here is the whole line-up, and how to pick yours.
          </p>

          <h2>What makes a real dosa</h2>
          <p>
            The batter is two ingredients: rice and urad dal (black gram). They are soaked separately, ground, combined and fermented naturally — the wild fermentation is what gives dosa its faint tang and its lacy, crisp texture. Skip the fermentation and you get something flat and doughy; that is the difference between a dosa made fresh and one made from an instant mix. Every dosa below is cooked to order and served with sambar and chutneys.
          </p>

          <h2>The twelve dosas, mild to wild</h2>
          <ul>
            {DOSAS.map(d => (
              <li key={d.slug}>
                <strong><Link href={d.slug}>{d.name}</Link> — {d.price}.</strong> {d.note}
              </li>
            ))}
          </ul>

          <h2>How to order dosa in Milton Keynes</h2>
          <p>
            Everything above is on our <Link href="/breakfast/dosas">dosa menu</Link> — order online for{' '}
            <Link href="/delivery">delivery across all MK postcodes</Link> (30–60 minutes from Greenleys) or collect and save 10%. Dosas travel packed with their chutneys and sambar separately so they arrive as crisp as we can make them. Breakfast runs from 8am at weekends and 11am on weekdays.
          </p>
          <p>
            Dietary notes: each dish page shows its veg/non-veg marker and spice level — check the individual item for anything allergen-related, or ask us in the order notes.
          </p>

          <h2>Your questions</h2>
          {FAQS.map(({ q, a }) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}

          <p>
            Hungry? <Link href="/order">Order now</Link> — or read <Link href="/blog/south-indian-vs-north-indian-food">what actually separates South and North Indian food</Link>.
          </p>
        </article>
      </main>
    </>
  );
}
