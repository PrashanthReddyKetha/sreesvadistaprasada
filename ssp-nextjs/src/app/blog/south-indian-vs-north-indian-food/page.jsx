import Link from 'next/link';

const SITE = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'South Indian Food vs North Indian Food — The Real Differences | Sree Svadista Prasada' },
  description: 'Rice vs wheat. Tamarind vs cream. Guntur chilli vs Kashmiri. A definitive guide to what actually separates South Indian and North Indian cuisine — ingredients, cooking methods, spice profiles, and breakfast traditions.',
  keywords: ['south indian vs north indian food', 'difference between south indian and north indian food', 'south indian food guide', 'Andhra cuisine', 'what is South Indian food', 'Indian food types UK'],
  openGraph: {
    title: 'South Indian Food vs North Indian Food — The Real Differences',
    description: 'Rice vs wheat, tamarind vs cream, dosas vs parathas. The definitive guide to what separates these two completely different cuisines.',
    type: 'article',
    url: `${SITE}/blog/south-indian-vs-north-indian-food`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1742281257687-092746ad6021?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian thali — comparing South and North Indian food' }],
  },
  twitter: { card: 'summary_large_image', title: 'South Indian vs North Indian Food — The Real Differences', images: ['https://images.unsplash.com/photo-1742281257687-092746ad6021?w=1200&q=80'] },
  alternates: { canonical: `${SITE}/blog/south-indian-vs-north-indian-food` },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'South Indian Food vs North Indian Food — The Real Differences',
    description: 'A comprehensive comparison of South Indian and North Indian cuisine: staple grains, cooking methods, key ingredients, spice profiles, and breakfast traditions.',
    author: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE },
    publisher: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
    datePublished: '2025-02-01',
    dateModified: '2026-07-01',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/south-indian-vs-north-indian-food` },
    image: 'https://images.unsplash.com/photo-1742281257687-092746ad6021?w=1200&q=80',
    articleSection: 'Food Guide',
    about: [
      { '@type': 'Thing', name: 'South Indian cuisine' },
      { '@type': 'Thing', name: 'North Indian cuisine' },
      { '@type': 'Thing', name: 'Andhra Pradesh cuisine' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: 'South Indian vs North Indian Food', item: `${SITE}/blog/south-indian-vs-north-indian-food` },
    ],
  },
];

const COMPARISON = [
  { aspect: 'Staple grain', south: 'Rice (short-grain, parboiled)', north: 'Wheat (chapati, naan, paratha)' },
  { aspect: 'Primary souring agent', south: 'Tamarind, kokum, gongura', north: 'Tomato, yoghurt, amchur (raw mango powder)' },
  { aspect: 'Main fat used', south: 'Sesame oil, coconut oil, groundnut oil', north: 'Ghee, butter, cream' },
  { aspect: 'Spice heat source', south: 'Guntur chilli, black pepper', north: 'Kashmiri chilli (mild colour), garam masala' },
  { aspect: 'Tempering technique', south: 'Talimpu/tadka: mustard, curry leaf, dried chilli in hot oil poured over food', north: 'Bhuna: slow-frying spice paste in oil before adding main ingredients' },
  { aspect: 'Typical breakfast', south: 'Idli, dosa, vada, upma, poha', north: 'Paratha, puri bhaji, aloo sabzi, chai' },
  { aspect: 'Gravy style', south: 'Thin, tangy, tamarind or coconut base', north: 'Thick, rich, cream or tomato-butter base' },
  { aspect: 'Signature ingredients', south: 'Curry leaves, mustard seeds, gongura, coconut, tamarind', north: 'Onion-tomato base, cream, fenugreek leaves, paneer' },
  { aspect: 'Cultural influence', south: 'Dravidian / Telugu / Tamil / Kannada tradition', north: 'Mughal / Persian influence, Punjab, Rajasthan' },
];

export default function SouthVsNorthArticle() {
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
              <span className="text-white">South vs North Indian Food</span>
            </nav>
            <span className="text-xs font-semibold text-amber-300 bg-amber-900/50 px-3 py-1 rounded-full uppercase tracking-wider">Food Guide</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4 leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              South Indian Food vs North Indian Food — The Real Differences
            </h1>
            <p className="text-amber-200 text-lg">8 min read &middot; Sree Svadista Prasada</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-6 py-12 prose prose-lg prose-amber">

          <p className="lead">
            Most people in the UK think of Indian food as a single cuisine. Chicken tikka masala. Naan bread. Rich, creamy curries with butter and Kashmiri chilli. This is the food that arrived via Punjab and the British Indian restaurant tradition. It is one very specific regional cuisine — and it represents perhaps 10% of what Indian food actually is.
          </p>
          <p>
            South Indian food is not a variation of North Indian food. It is a completely different culinary tradition with different grains, different fats, different souring agents, different spice philosophies, and completely different breakfast dishes. The two cuisines share a country and not much else.
          </p>

          <h2>The Basic Split: Geography and History</h2>
          <p>
            India is geographically enormous — roughly the size of Western Europe. The north (Punjab, Rajasthan, Uttar Pradesh, Bihar, Mughal heartlands) was shaped by centuries of Persian and Central Asian influence, wheat farming, and dairy culture. The south (Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana) was shaped by Dravidian civilisation, rice farming, coastal trade with Southeast Asia, and complete independence from Mughal rule.
          </p>
          <p>
            These are not minor differences. The two regions are separated by climate, geography, farming culture, language family, and 1,000+ years of distinct culinary evolution.
          </p>

          <h2>Quick Reference: Side-by-Side</h2>

          <div className="not-prose overflow-x-auto my-8">
            <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-amber-800 text-white">
                  <th className="text-left p-3 font-semibold">Aspect</th>
                  <th className="text-left p-3 font-semibold">South Indian</th>
                  <th className="text-left p-3 font-semibold">North Indian</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.aspect} className={i % 2 === 0 ? 'bg-amber-50' : 'bg-white'}>
                    <td className="p-3 font-medium text-gray-700 border-b border-amber-100">{row.aspect}</td>
                    <td className="p-3 text-gray-600 border-b border-amber-100">{row.south}</td>
                    <td className="p-3 text-gray-600 border-b border-amber-100">{row.north}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Grains: The Foundation of Everything</h2>
          <p>
            The single most defining difference is the staple grain. South India is a rice civilisation. Rice was domesticated here thousands of years ago, and the landscape of South Indian cooking — idli, dosa, sambar, rasam, rice dishes, chutneys — is entirely built around it.
          </p>
          <p>
            North India is a wheat civilisation. The flat, dry landscapes of Punjab, Haryana, and Uttar Pradesh are ideal for wheat farming. The result: chapati, naan, paratha, puri, roti. Bread is the vehicle for everything.
          </p>
          <p>
            When most British people eat &ldquo;Indian food&rdquo; and scoop curry onto naan, they are eating North Indian food. A South Indian meal is almost always rice-centred — with sambar, rasam, chutneys, curries, and vegetables served alongside rice, not bread.
          </p>

          <h2>Spice: Heat vs Complexity</h2>
          <p>
            Both cuisines are spiced, but in completely different ways.
          </p>
          <p>
            South Indian spicing is built around <strong>heat and tang</strong>. The Guntur chilli — grown in Andhra Pradesh and one of the hottest chillies in the world — provides aggressive heat. Black pepper adds deeper heat. Tamarind, gongura (sorrel), and kokum provide acidity. The overall effect is sharp, direct, and intensely flavoured.
          </p>
          <p>
            North Indian spicing is built around <strong>aroma and complexity</strong>. Garam masala (a blend of cinnamon, cardamom, cloves, cumin, coriander, nutmeg) creates warmth and depth. Kashmiri chilli adds vivid red colour but relatively low heat. Cream and butter round out the sharp edges. The result is rich, layered, and fragrant.
          </p>

          <h2>The Andhra Difference</h2>
          <p>
            Within South India, Andhra Pradesh and Telangana (the Telugu-speaking states) have the most distinctive cuisine. Andhra food is arguably the spiciest in all of India — Guntur district is the world&apos;s largest producer of red chillies, and the local cuisine uses them with extraordinary generosity.
          </p>
          <p>
            The signature ingredient nobody else uses: <strong>gongura</strong> — the tangy sorrel leaf that appears in chutneys, curries (gongura chicken, gongura mutton), pickles, and dals. No other regional cuisine in India uses gongura. It is the flavour that immediately identifies a dish as Andhra.
          </p>
          <p>
            This is what Sree Svadista Prasada specialises in: specifically Andhra-Telugu cooking, not the generic &ldquo;Indian&rdquo; food that most UK restaurants serve.
          </p>

          <h2>Breakfast: Where the Difference Is Most Obvious</h2>
          <p>
            The breakfast traditions of North and South India are completely unrelated.
          </p>
          <p>
            A typical South Indian breakfast: <strong>idli</strong> (steamed rice-lentil cakes), <strong>dosa</strong> (crispy fermented rice crepe), <strong>vada</strong> (fried lentil doughnut), <strong>upma</strong> (spiced semolina porridge), or <strong>poha</strong> (flattened rice). All served with coconut chutney and sambar.
          </p>
          <p>
            A typical North Indian breakfast: <strong>paratha</strong> (fried wheat flatbread with butter), <strong>puri bhaji</strong> (fried bread with potato curry), <strong>aloo sabzi</strong>, or simply chai and biscuits.
          </p>
          <p>
            When you eat idli-sambar for breakfast, you are eating something with no counterpart in North Indian cuisine at all.
          </p>

          <h2>Dairy: The Great Divide</h2>
          <p>
            North Indian cooking is built on dairy. Ghee, butter, cream, yoghurt (as marinade in tikka), paneer — these are central, not peripheral. Butter chicken, dal makhani, shahi paneer — the cream-richness is the point.
          </p>
          <p>
            Traditional South Indian cooking uses very little dairy. Coconut oil or sesame oil replaces butter. Coconut milk replaces cream. Many classic South Indian dishes — sambar, rasam, most chutneys, all rice dishes, most pickles — are naturally vegan. This is why South Indian temple food (prasadam) is so often fully plant-based.
          </p>

          <div className="not-prose bg-amber-800 text-white rounded-2xl p-8 text-center my-8">
            <h3 className="text-2xl font-bold mb-2">Experience Authentic Andhra Cuisine</h3>
            <p className="text-amber-200 mb-6">Gongura curries, dosas, biryanis and more — delivered in Milton Keynes or shipped UK-wide.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/svadista" className="inline-block bg-amber-400 text-gray-900 font-bold px-6 py-3 rounded-full hover:bg-amber-300 transition-colors">
                Svadista Menu
              </Link>
              <Link href="/prasada" className="inline-block bg-white/20 text-white font-bold px-6 py-3 rounded-full hover:bg-white/30 transition-colors">
                Prasada Menu
              </Link>
            </div>
          </div>

        </article>
      </main>
    </>
  );
}
