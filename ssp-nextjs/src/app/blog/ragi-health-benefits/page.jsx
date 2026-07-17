import Link from 'next/link';

const SITE = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'Ragi: The Ancient South Indian Superfood | Health Benefits of Finger Millet | Sree Svadista Prasada' },
  description: 'Ragi (finger millet) is a gluten-free ancient grain with more calcium than milk, a low glycaemic index, and exceptional fibre. Discover its nutritional profile, traditional uses in Andhra cooking, and how Sree Svadista Prasada uses it.',
  keywords: ['ragi health benefits', 'finger millet benefits', 'ragi nutrition', 'ragi dosa', 'ragi gluten free', 'South Indian superfoods', 'ragi recipe UK', 'ragi Milton Keynes'],
  openGraph: {
    title: 'Ragi: The Ancient South Indian Superfood | Health Benefits of Finger Millet',
    description: 'More calcium than milk, low GI, naturally gluten-free. Ragi (finger millet) has been a staple of South Indian cooking for 4,000 years — here\'s why nutritionists are rediscovering it.',
    type: 'article',
    url: `${SITE}/blog/ragi-health-benefits`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=1200&q=80', width: 1200, height: 630, alt: 'Ragi (finger millet) — ancient South Indian superfood' }],
  },
  twitter: { card: 'summary_large_image', title: 'Ragi: The Ancient South Indian Superfood', images: ['https://images.unsplash.com/photo-1743615467363-250466982515?w=1200&q=80'] },
  alternates: { canonical: `${SITE}/blog/ragi-health-benefits` },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Ragi: The Ancient South Indian Superfood Nutritionists Are Rediscovering',
    description: 'Ragi (finger millet / Eleusine coracana) is a gluten-free ancient grain with exceptional calcium content, low glycaemic index, and high dietary fibre. A nutritional deep-dive into the Andhra staple.',
    author: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE },
    publisher: { '@type': 'Organization', name: 'Sree Svadista Prasada', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
    datePublished: '2025-03-01',
    dateModified: '2026-07-01',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/ragi-health-benefits` },
    image: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=1200&q=80',
    articleSection: 'Nutrition & Wellness',
    about: { '@type': 'Thing', name: 'Ragi', alternateName: ['Finger millet', 'Eleusine coracana', 'Nachni', 'Mandua'] },
    keywords: ['ragi', 'finger millet', 'ragi health benefits', 'ragi nutrition', 'gluten-free grains', 'South Indian food'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: 'Ragi Health Benefits', item: `${SITE}/blog/ragi-health-benefits` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What is ragi?', acceptedAnswer: { '@type': 'Answer', text: 'Ragi is finger millet (Eleusine coracana), a small-seeded cereal grain grown widely in South India, East Africa, and South Asia. It is one of the most nutritionally dense grains available, with exceptionally high calcium, fibre, and a low glycaemic index. It is naturally gluten-free.' } },
      { '@type': 'Question', name: 'What are the health benefits of ragi?', acceptedAnswer: { '@type': 'Answer', text: 'Ragi contains more calcium than milk gram-for-gram, has a low glycaemic index (ideal for diabetics and weight management), is high in dietary fibre, rich in iron and B vitamins, and is naturally gluten-free. It also contains the amino acid methionine and polyphenol antioxidants.' } },
      { '@type': 'Question', name: 'Is ragi gluten-free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Ragi (finger millet) is naturally gluten-free and suitable for people with coeliac disease or gluten sensitivity. It is also suitable for those following a wheat-free diet.' } },
    ],
  },
];

const NUTRITION = [
  { nutrient: 'Calcium', per100g: '344 mg', vs: '~3× more than cow\'s milk (119 mg/100ml)' },
  { nutrient: 'Dietary fibre', per100g: '3.6 g', vs: 'Higher than white rice (0.3g) or wheat flour (2.7g)' },
  { nutrient: 'Iron', per100g: '3.9 mg', vs: 'Higher than most grains' },
  { nutrient: 'Glycaemic Index (GI)', per100g: '~54 (low)', vs: 'Rice: ~72 (high), White bread: ~75 (high)' },
  { nutrient: 'Protein', per100g: '7.3 g', vs: 'Comparable to wheat and maize' },
  { nutrient: 'Calories', per100g: '328 kcal', vs: 'Similar to other grains' },
];

export default function RagiArticle() {
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
              <span className="text-white">Ragi Health Benefits</span>
            </nav>
            <span className="text-xs font-semibold text-amber-300 bg-amber-900/50 px-3 py-1 rounded-full uppercase tracking-wider">Nutrition &amp; Wellness</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-4 leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              Ragi: The Ancient South Indian Superfood Nutritionists Are Rediscovering
            </h1>
            <p className="text-amber-200 text-lg">7 min read &middot; Sree Svadista Prasada</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-6 py-12 prose prose-lg prose-amber">

          <p className="lead">
            Before quinoa. Before chia seeds. Before any Western &ldquo;superfood&rdquo; trend arrived, the villages of Andhra Pradesh and Karnataka were eating ragi — a small, dark-brown grain that out-performs almost every modern health food on calcium, fibre, and glycaemic response.
          </p>
          <p>
            Ragi has been farmed in South India for over 4,000 years. It was the everyday grain of rural Andhra communities before white rice became affordable. Grandmothers served it to nursing mothers. It was the first solid food given to infants. It was prescribed by village practitioners for strengthening bones, managing blood sugar, and aiding digestion.
          </p>
          <p>
            Western nutritional science is now catching up with what South Indian tradition always knew.
          </p>

          <h2>What Is Ragi?</h2>
          <p>
            Ragi is finger millet (<em>Eleusine coracana</em>), a cereal crop in the grass family grown across South India, East Africa, Nepal, and Sri Lanka. The grain itself is tiny — roughly the size of a mustard seed — and ranges in colour from white to deep reddish-brown depending on the variety. The reddish-brown variety is most common in South India and is the most nutritionally dense.
          </p>
          <p>
            It is also called <em>nachni</em> in Maharashtra, <em>mandua</em> in Hindi, <em>keppai</em> in Tamil, and <em>ragulu</em> in Telugu. In English, &ldquo;finger millet&rdquo; refers to the finger-like projections on the seed head.
          </p>

          <h2>Nutritional Profile</h2>
          <p>
            The data on ragi is striking. Per 100g of dry grain:
          </p>

          <div className="not-prose overflow-x-auto my-8">
            <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-amber-800 text-white">
                  <th className="text-left p-3 font-semibold">Nutrient</th>
                  <th className="text-left p-3 font-semibold">Ragi (per 100g)</th>
                  <th className="text-left p-3 font-semibold">Context</th>
                </tr>
              </thead>
              <tbody>
                {NUTRITION.map((row, i) => (
                  <tr key={row.nutrient} className={i % 2 === 0 ? 'bg-amber-50' : 'bg-white'}>
                    <td className="p-3 font-medium text-gray-700 border-b border-amber-100">{row.nutrient}</td>
                    <td className="p-3 text-amber-800 font-semibold border-b border-amber-100">{row.per100g}</td>
                    <td className="p-3 text-gray-500 text-xs border-b border-amber-100">{row.vs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Why the Calcium Content Matters</h2>
          <p>
            Ragi&apos;s calcium content is extraordinary. At 344 mg per 100g, it contains roughly three times more calcium than cow&apos;s milk per gram of weight. This makes it one of the best plant-based calcium sources available — significantly better than kale (150 mg/100g), broccoli (47 mg/100g), or most other grains.
          </p>
          <p>
            This is why traditional South Indian practice gave ragi to pregnant women, nursing mothers, and young children. Without access to dairy supplements or calcium tablets, ragi provided the same bone-building nutrition. It remains especially important for people following vegan or dairy-free diets.
          </p>

          <h2>Ragi and Blood Sugar</h2>
          <p>
            Ragi has a Glycaemic Index (GI) of approximately 54, which places it in the &ldquo;low&rdquo; category (under 55). For comparison, white rice has a GI of approximately 72–78, and white bread around 75.
          </p>
          <p>
            A lower GI means slower glucose release into the bloodstream — which means more stable energy, fewer blood sugar spikes, and better long-term management for people with type 2 diabetes or pre-diabetes. The high fibre content (3.6g/100g) contributes to this effect.
          </p>
          <p>
            Peer-reviewed studies have found that regular ragi consumption significantly reduces fasting blood glucose levels in diabetic patients compared to rice-based diets. This was well known in South Indian villages centuries before the science was formalised.
          </p>

          <h2>Naturally Gluten-Free</h2>
          <p>
            Ragi is completely free of gluten — the protein found in wheat, barley, and rye that causes immune reactions in people with coeliac disease or gluten sensitivity. It is a safe and nutritious alternative for the growing population avoiding gluten for medical or lifestyle reasons.
          </p>
          <p>
            Unlike many &ldquo;gluten-free&rdquo; alternatives (rice flour, potato starch) that are high GI and nutritionally thin, ragi is both gluten-free and nutritionally dense — making it one of the most valuable alternatives for those managing coeliac disease.
          </p>

          <h2>How Ragi Is Used in Andhra Cooking</h2>
          <p>
            In South India, ragi is used in several distinct forms:
          </p>
          <ul>
            <li><strong>Ragi mudde / sangati</strong> — stiff ragi ball (porridge formed into a ball), a staple of rural Andhra and Karnataka. Served with sambar, dal, or leafy greens. High-protein, high-fibre, deeply filling.</li>
            <li><strong>Ragi dosa</strong> — a thin, crispy crepe made from ragi flour with the same technique as rice dosa. Slightly earthier, nuttier flavour. Excellent with coconut chutney.</li>
            <li><strong>Ragi laddu</strong> — sweet balls made from ragi flour, jaggery (unrefined sugar), ghee, and sesame seeds. Traditional festival sweet and a common first solid food for infants.</li>
            <li><strong>Ragi ambali / java</strong> — a thin porridge drunk as a morning meal. Traditional in rural Andhra households, now being rediscovered as a health drink.</li>
          </ul>

          <h2>Try Ragi at Sree Svadista Prasada</h2>
          <p>
            Our dedicated <Link href="/ragi-specials" className="text-amber-700 font-semibold hover:underline">Ragi Specials</Link> menu features ragi prepared in traditional Andhra style — not as a health food novelty but as the grain has always been eaten in South Indian homes. All ragi dishes are naturally gluten-free and suitable for diabetics and those on a low-GI diet.
          </p>

          <div className="not-prose bg-amber-800 text-white rounded-2xl p-8 text-center my-8">
            <h3 className="text-2xl font-bold mb-2">Try Our Ragi Specials</h3>
            <p className="text-amber-200 mb-6">Ragi Dosa, Ragi Sangati, Ragi Laddu — traditional Andhra recipes delivered in Milton Keynes.</p>
            <Link href="/ragi-specials" className="inline-block bg-amber-400 text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-amber-300 transition-colors">
              View Ragi Menu
            </Link>
          </div>

        </article>
      </main>
    </>
  );
}
