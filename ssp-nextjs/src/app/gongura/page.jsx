import Link from 'next/link';

const SITE = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'What Is Gongura? The Andhra Sorrel Leaf Guide | Sree Svadista Prasada' },
  description: 'Gongura is the iconic tangy sorrel leaf of Andhra Pradesh — rich in iron, folate and calcium. Discover what gongura is, how it tastes, and where to eat authentic gongura dishes in the UK.',
  keywords: [
    'what is gongura', 'gongura leaf', 'gongura UK', 'gongura chicken UK',
    'gongura mutton UK', 'Andhra sorrel', 'gongura pickle', 'Telugu food UK',
    'South Indian food Milton Keynes', 'Andhra restaurant UK',
  ],
  openGraph: {
    title: 'What Is Gongura? The Andhra Sorrel Leaf Guide | Sree Svadista Prasada',
    description: 'The tangy sorrel leaf that defines Andhra cuisine. Rich in iron and folate, used in curries, chutneys, and pickles. Available at Sree Svadista Prasada in the UK.',
    type: 'article',
    url: `${SITE}/gongura`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Gongura (sorrel) leaves — the signature ingredient of Andhra cuisine',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What Is Gongura? The Andhra Sorrel Leaf Guide',
    description: 'Gongura — the tangy sorrel leaf that defines Andhra Pradesh cooking. Discover its flavour, nutrition, and traditional uses.',
    images: ['https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80'],
  },
  alternates: { canonical: `${SITE}/gongura` },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'What Is Gongura? A Complete Guide to the Andhra Sorrel Leaf',
    description: 'Gongura is a leafy green native to Andhra Pradesh, South India, prized for its tangy-sour flavour. Rich in iron, folate, and calcium, it is the defining ingredient of Telugu cuisine.',
    author: {
      '@type': 'Organization',
      name: 'Sree Svadista Prasada',
      url: SITE,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sree Svadista Prasada',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
    },
    datePublished: '2025-01-01',
    dateModified: '2026-07-01',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/gongura` },
    image: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80',
    about: {
      '@type': 'Thing',
      name: 'Gongura',
      alternateName: ['Sorrel leaves', 'Hibiscus sabdariffa', 'Ambadi', 'Kenaf leaves', 'Pulicha keerai'],
      description: 'A leafy green plant native to Andhra Pradesh used extensively in Telugu cuisine for its tangy, sour flavour.',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Gongura Guide', item: `${SITE}/gongura` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is gongura?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Gongura is a leafy green plant (Hibiscus sabdariffa / Roselle / sorrel) native to Andhra Pradesh in South India. It is known for its intensely tangy, sour flavour and is the defining ingredient of Telugu cuisine. It is used in chutneys, curries, pickles, and dals.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does gongura taste like?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Gongura has a distinctive sharp, tangy-sour flavour similar to sorrel or tamarind, but with a fresher, leafier quality. It adds a fruity acidity to dishes that is unlike any other South Indian souring agent.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where can I eat gongura dishes in the UK?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sree Svadista Prasada serves authentic Gongura Chicken Curry and Gongura Mutton Curry in Milton Keynes, Edinburgh, and Glasgow — one of the very few restaurants in the UK offering authentic Andhra gongura preparations.',
        },
      },
    ],
  },
];

export default function GonguraPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-amber-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <nav className="text-green-300 text-sm mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-white">Gongura Guide</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              What Is Gongura?
            </h1>
            <p className="text-xl text-green-200 leading-relaxed">
              The tangy sorrel leaf that defines Andhra Pradesh cooking — and one of the
              most nutritious leafy greens in South Indian cuisine.
            </p>
          </div>
        </section>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-6 py-12 prose prose-lg prose-amber">

          <h2>The Pride of Andhra</h2>
          <p>
            Gongura (<em>Hibiscus sabdariffa</em>, also known as Roselle, sorrel, or ambadi) is a
            leafy green plant grown across Andhra Pradesh and Telangana in South India. Its leaves
            have a sharp, intensely sour flavour — tart and tangy in a way that is completely
            distinct from tamarind, lemon, or any other souring agent used in Indian cooking.
          </p>
          <p>
            In Telugu, the language of Andhra Pradesh, gongura is sometimes called &ldquo;the pride
            of Andhra&rdquo; (<em>Andhra rashtra puvu</em>). No other regional Indian cuisine uses
            it with such creativity or devotion. While the plant grows across tropical Asia and
            Africa, it is the Telugu kitchen that elevated it into an art form.
          </p>

          <h2>What Does Gongura Taste Like?</h2>
          <p>
            The flavour is immediately recognisable: bright, sharp, and sour with a leafy freshness.
            It is often compared to sorrel (common in European cooking), but gongura has a more
            complex, slightly fruity tartness and a distinctive fibrous texture when cooked. Raw
            leaves are intensely acidic; cooking mellows the sharpness while concentrating the
            deep sour flavour into whatever dish it joins.
          </p>
          <p>
            The sourness comes from the high concentration of oxalic acid and hibiscus acid in the
            leaves — the same compounds responsible for the vivid red colour of hibiscus tea.
          </p>

          <h2>Nutritional Profile</h2>
          <p>
            Gongura is not just flavour — it is one of the most nutritionally dense leafy greens
            available. A 100g serving provides:
          </p>
          <ul>
            <li><strong>Iron</strong> — significantly higher than spinach; important for preventing anaemia</li>
            <li><strong>Folate (Vitamin B9)</strong> — essential for cell health and pregnancy nutrition</li>
            <li><strong>Calcium</strong> — supports bone density</li>
            <li><strong>Vitamin C</strong> — boosts iron absorption and immune function</li>
            <li><strong>Antioxidants</strong> — anthocyanins and polyphenols that reduce oxidative stress</li>
          </ul>
          <p>
            Traditional Andhra medicine (and modern nutritional research) recognises gongura as a
            blood-building food — it was historically given to women post-partum and to those
            recovering from anaemia.
          </p>

          <h2>Gongura in the Kitchen</h2>
          <p>Telugu cooks use gongura in several distinct preparations:</p>
          <ul>
            <li>
              <strong>Gongura Pachadi (chutney)</strong> — coarsely ground with fried red chillies,
              garlic, and mustard seeds. Eaten with rice, it is a fixture on every Andhra table.
            </li>
            <li>
              <strong>Gongura Chicken (Gongura Kodi Kura)</strong> — tender chicken slow-cooked with
              fresh gongura leaves, Guntur chillies, and Andhra spices. The sourness of the gongura
              tenderises the meat while infusing it with flavour.
            </li>
            <li>
              <strong>Gongura Mutton</strong> — the same principle applied to slow-cooked mutton on
              the bone. Considered by many Andhra food lovers to be the finest expression of Telugu
              non-vegetarian cooking.
            </li>
            <li>
              <strong>Gongura Dal (pappu)</strong> — toor dal cooked with gongura leaves, finished
              with a mustard and red chilli tadka. Simple, nutritious, and deeply comforting.
            </li>
            <li>
              <strong>Gongura Pickle</strong> — salt-preserved gongura with spices, oil, and
              sometimes dried shrimp. Keeps for months and grows more complex with age.
            </li>
          </ul>

          <h2>Where to Eat Authentic Gongura in the UK</h2>
          <p>
            Genuine gongura dishes are rare in the UK. Most Indian restaurants serve Punjabi or
            generic &ldquo;Indian&rdquo; food that has little connection to Andhra cuisine. At
            Sree Svadista Prasada, we prepare both{' '}
            <Link href="/svadista" className="text-amber-700 font-semibold hover:underline">
              Gongura Chicken Curry
            </Link>{' '}
            and Gongura Mutton using fresh gongura leaves sourced specifically for the authentic
            flavour — not substituted with tamarind or other souring agents.
          </p>
          <p>
            We serve across{' '}
            <Link href="/milton-keynes" className="text-amber-700 font-semibold hover:underline">Milton Keynes</Link>,{' '}
            <Link href="/edinburgh" className="text-amber-700 font-semibold hover:underline">Edinburgh</Link>, and{' '}
            <Link href="/glasgow" className="text-amber-700 font-semibold hover:underline">Glasgow</Link>.
          </p>

          {/* FAQ */}
          <h2>Gongura FAQ</h2>
          <div className="space-y-4 not-prose">
            {[
              {
                q: 'Is gongura available in UK supermarkets?',
                a: 'Dried gongura leaves are occasionally found in South Asian grocery stores. Fresh gongura is extremely rare in the UK outside specialist suppliers. This is why it is so difficult to find authentic gongura dishes in British restaurants.',
              },
              {
                q: 'Is gongura the same as sorrel?',
                a: 'They are related plants from the same Hibiscus family with a similar tangy flavour profile, but gongura (Hibiscus sabdariffa / Roselle) is a different species from common sorrel (Rumex acetosa). The flavour of gongura is more intense and slightly more fruity.',
              },
              {
                q: 'Is gongura vegan?',
                a: 'Yes — the plant itself is vegan. Gongura dal and gongura chutney are entirely plant-based. Gongura chicken and gongura mutton are non-vegetarian dishes.',
              },
              {
                q: 'What does "gongura" mean in Telugu?',
                a: 'Gongura (గోంగూర) is the Telugu name for the plant. It is also called ambadi in Marathi, kenaf or Roselle in English botanical contexts, and Hibiscus sabdariffa in Latin.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white rounded-lg p-4 border border-amber-200">
                <summary className="font-semibold text-gray-800 cursor-pointer">{q}</summary>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-green-800 text-white rounded-2xl p-8 not-prose text-center">
            <h3 className="text-2xl font-bold mb-2">Try Authentic Gongura Dishes</h3>
            <p className="text-green-200 mb-6">
              Order Gongura Chicken or Gongura Mutton — delivered in Milton Keynes,
              Edinburgh &amp; Glasgow.
            </p>
            <Link
              href="/svadista"
              className="inline-block bg-amber-400 text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-amber-300 transition-colors"
            >
              View Svadista Menu
            </Link>
          </div>

        </article>
      </main>
    </>
  );
}
