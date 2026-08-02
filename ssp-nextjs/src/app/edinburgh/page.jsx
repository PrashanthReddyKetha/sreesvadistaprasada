import Link from 'next/link';

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'South Indian Food Edinburgh — Coming Soon | Sree Svadista Prasada' },
  description: 'Authentic Andhra South Indian food is coming to Edinburgh. Register your interest for Dabba Wala tiffin deliveries and fresh Indian meals across Edinburgh EH postcodes.',
  alternates: { canonical: `${BASE_URL}/edinburgh` },
  openGraph: {
    title: 'South Indian Food Edinburgh — Coming Soon | Sree Svadista Prasada',
    description: 'Authentic Andhra South Indian food is coming to Edinburgh. Register your interest for Dabba Wala tiffin subscriptions and fresh Indian meals.',
    type: 'website',
    url: `${BASE_URL}/edinburgh`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian food Edinburgh — Sree Svadista Prasada' }],
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Sree Svadista Prasada',
    description: 'Authentic South Indian restaurant delivering Andhra curries, dosas, biryani and Dabba Wala tiffin subscriptions. Currently serving Milton Keynes — Edinburgh coming soon.',
    url: `${BASE_URL}/edinburgh`,
    telephone: '+447307119962',
    email: 'info@sreesvadistaprasada.com',
    servesCuisine: ['South Indian', 'Andhra', 'Telugu', 'Indian', 'Vegetarian', 'Vegan', 'Halal'],
    address: { '@type': 'PostalAddress', addressLocality: 'Edinburgh', addressRegion: 'Scotland', addressCountry: 'GB' },
    areaServed: { '@type': 'City', name: 'Edinburgh' },
    sameAs: ['https://www.sreesvadistaprasada.com'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Is there an authentic South Indian restaurant in Edinburgh?', acceptedAnswer: { '@type': 'Answer', text: 'Sree Svadista Prasada, the UK\'s only dedicated Andhra kitchen, is expanding to Edinburgh. Currently serving Milton Keynes. Register your interest for Edinburgh delivery and be first to know when we launch.' } },
      { '@type': 'Question', name: 'Where can I get South Indian food delivered in Edinburgh?', acceptedAnswer: { '@type': 'Answer', text: 'We are bringing authentic Andhra curries, dosas, gongura dishes, and our Dabba Wala tiffin subscription to Edinburgh. Contact us via WhatsApp to register your postcode.' } },
      { '@type': 'Question', name: 'What is Dabba Wala tiffin delivery?', acceptedAnswer: { '@type': 'Answer', text: 'Dabba Wala is a weekly South Indian home-style meal subscription — fresh tiffin boxes delivered to your door. From £7 per meal, currently available in Milton Keynes and coming to Edinburgh.' } },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Edinburgh', item: `${BASE_URL}/edinburgh` },
    ],
  },
];

const AREAS = [
  'Leith', 'Marchmont', 'Newington', 'Bruntsfield',
  'Tollcross', 'Morningside', 'Southside', 'Old Town',
  'New Town', 'Portobello', 'Stockbridge', 'Haymarket',
  'Gorgie', 'Dalry', 'Corstorphine', 'Musselburgh',
];

export default function EdinburghPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen">
        {/* Hero */}
        <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden" style={{ minHeight: 'min(50vh, 420px)', backgroundColor: '#800020' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #F4C430 0%, transparent 60%)' }} />
          <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 flex flex-col justify-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-amber-400 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                🏴󠁧󠁢󠁳󠁣󠁴󠁿 Coming Soon to Edinburgh
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                South Indian Food Delivery in Edinburgh
              </h1>
              <p className="text-base md:text-lg text-gray-200 mb-8 leading-relaxed">
                Edinburgh&rsquo;s only Andhra kitchen is on its way — authentic gongura curries, dosas, Dabba Wala tiffin subscriptions across Leith, Marchmont, Newington and all Edinburgh EH postcodes.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="https://wa.me/447307119962?text=I%27m%20interested%20in%20South%20Indian%20food%20delivery%20in%20Edinburgh" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 text-sm font-semibold rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                    Register Your Edinburgh Postcode
                  </button>
                </a>
                <Link href="/menu">
                  <button className="px-6 py-3 text-sm font-semibold rounded-sm border transition-all duration-300 hover:bg-white hover:text-[#800020]" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
                    Browse Our Menu
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery areas */}
        <section className="py-16 px-4" style={{ backgroundColor: '#F9F6EE' }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>Planned Edinburgh Delivery Areas</h2>
            <p className="text-gray-500 mb-8">We&rsquo;re mapping our delivery zones across Edinburgh. If your area isn&rsquo;t listed, WhatsApp us — we&rsquo;ll add it.</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(area => (
                <span key={area} className="px-3 py-1.5 bg-white border border-amber-200 text-gray-700 text-sm rounded-full">{area}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Currently ordering */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>Want Authentic South Indian Food Now?</h2>
            <p className="text-gray-600 mb-8">While Edinburgh is coming soon, our full menu including UK-wide shipping for snacks, pickles and podis is available today. Dabba Wala subscriptions ship UK-wide.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/snacks" className="inline-block px-6 py-3 rounded-sm font-semibold text-sm" style={{ backgroundColor: '#800020', color: '#fff' }}>Shop Snacks &amp; Pickles</Link>
              <Link href="/subscriptions" className="inline-block px-6 py-3 rounded-sm font-semibold text-sm border" style={{ borderColor: '#800020', color: '#800020' }}>Dabba Wala Subscriptions</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
