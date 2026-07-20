import Link from 'next/link';

const BASE_URL = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'South Indian Food Glasgow — Coming Soon | Sree Svadista Prasada' },
  description: 'Authentic Andhra South Indian food is coming to Glasgow. Register your interest for Dabba Wala tiffin deliveries and fresh Indian meals across Glasgow G postcodes.',
  alternates: { canonical: `${BASE_URL}/glasgow` },
  openGraph: {
    title: 'South Indian Food Glasgow — Coming Soon | Sree Svadista Prasada',
    description: 'Authentic Andhra South Indian food is coming to Glasgow. Register your interest for Dabba Wala tiffin subscriptions and fresh Indian meals.',
    type: 'website',
    url: `${BASE_URL}/glasgow`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian food Glasgow — Sree Svadista Prasada' }],
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Sree Svadista Prasada',
    description: 'Authentic South Indian restaurant delivering Andhra curries, dosas, biryani and Dabba Wala tiffin subscriptions. Currently serving Milton Keynes — Glasgow coming soon.',
    url: `${BASE_URL}/glasgow`,
    telephone: '+447307119962',
    email: 'info@sreesvadistaprasada.com',
    servesCuisine: ['South Indian', 'Andhra', 'Telugu', 'Indian', 'Vegetarian', 'Vegan', 'Halal'],
    address: { '@type': 'PostalAddress', addressLocality: 'Glasgow', addressRegion: 'Scotland', addressCountry: 'GB' },
    areaServed: { '@type': 'City', name: 'Glasgow' },
    sameAs: ['https://sreesvadistaprasada.com'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Is there a South Indian restaurant in Glasgow?', acceptedAnswer: { '@type': 'Answer', text: 'Sree Svadista Prasada, the UK\'s only dedicated Andhra Telugu kitchen, is expanding to Glasgow. Currently serving Milton Keynes. Register your interest to be first to know when we launch Glasgow delivery.' } },
      { '@type': 'Question', name: 'Where can I get South Indian food delivered in Glasgow?', acceptedAnswer: { '@type': 'Answer', text: 'We are bringing authentic Andhra curries, gongura dishes, dosas, and our Dabba Wala tiffin subscription to Glasgow. Contact us via WhatsApp to register your postcode.' } },
      { '@type': 'Question', name: 'What makes Sree Svadista Prasada different from other Indian restaurants in Glasgow?', acceptedAnswer: { '@type': 'Answer', text: 'Unlike most "Indian" restaurants in Glasgow that serve Punjabi-style North Indian food, Sree Svadista Prasada specialises exclusively in Andhra Pradesh and Telugu cuisine — gongura curries, Guntur-spiced dishes, temple-style Prasada cooking, and the Dabba Wala home-style meal subscription.' } },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Glasgow', item: `${BASE_URL}/glasgow` },
    ],
  },
];

const AREAS = [
  'Pollokshields', 'Shawlands', 'Govanhill', 'Southside Glasgow',
  'Finnieston', 'West End', 'Partick', 'Merchant City',
  'Dennistoun', 'Maryhill', 'Hillhead', 'Byres Road',
  'East End', 'Springburn', 'Govan', 'City Centre',
];

export default function GlasgowPage() {
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
                🏴󠁧󠁢󠁳󠁣󠁴󠁿 Coming Soon to Glasgow
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                South Indian Food Delivery in Glasgow
              </h1>
              <p className="text-base md:text-lg text-gray-200 mb-8 leading-relaxed">
                Slow-cooked Andhra and Telugu food coming to Pollokshields, Shawlands, Govanhill, Finnieston, West End and across Glasgow — gongura curries, dosas, biryani and Dabba Wala tiffin subscriptions.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="https://wa.me/447307119962?text=I%27m%20interested%20in%20South%20Indian%20food%20delivery%20in%20Glasgow" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 text-sm font-semibold rounded-sm transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                    Register Your Glasgow Postcode
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>Planned Glasgow Delivery Areas</h2>
            <p className="text-gray-500 mb-8">We&rsquo;re mapping our delivery zones across Glasgow. WhatsApp us your postcode to register your interest.</p>
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
            <p className="text-gray-600 mb-8">While Glasgow is coming soon, our UK-wide shipping for snacks, pickles and podis is available today. Dabba Wala subscriptions ship UK-wide.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/snacks"><button className="px-6 py-3 rounded-sm font-semibold text-sm" style={{ backgroundColor: '#800020', color: '#fff' }}>Shop Snacks &amp; Pickles</button></Link>
              <Link href="/subscriptions"><button className="px-6 py-3 rounded-sm font-semibold text-sm border" style={{ borderColor: '#800020', color: '#800020' }}>Dabba Wala Subscriptions</button></Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
