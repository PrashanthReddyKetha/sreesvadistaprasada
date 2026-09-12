import SubscriptionsClient from './SubscriptionsClient';

export const metadata = {
  title: { absolute: 'Indian Tiffin Delivery Milton Keynes | Sree Svadista Prasada' },
  description: 'Indian tiffin service Milton Keynes — freshly cooked daily South Indian meals from £75/week. Veg & non-veg Andhra boxes delivered Mon–Fri. Subscribe now.',
  openGraph: {
    title: 'Indian Tiffin Delivery Milton Keynes | Dabba Wala | Sree Svadista Prasada',
    description: 'Indian tiffin service Milton Keynes — freshly cooked daily South Indian meals from £75/week. Veg & non-veg Andhra boxes delivered Mon–Fri. Subscribe now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/subscriptions',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80', width: 1200, height: 630, alt: 'Indian Tiffin Delivery Milton Keynes — Dabba Wala' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Tiffin Delivery Milton Keynes | Sree Svadista Prasada',
    description: 'Indian tiffin service Milton Keynes — freshly cooked daily South Indian meals from £75/week. Veg & non-veg Andhra boxes delivered Mon–Fri. Subscribe now.',
    images: ['https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/subscriptions' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Dabba Wala — Weekly South Indian Meal Subscription',
  description: 'Weekly home-cooked South Indian meal plan delivered to your door in Milton Keynes. Fresh Andhra and Telugu cooking — rice, dal, curry, pickle and papad every day.',
  brand: { '@type': 'Brand', name: 'Sree Svadista Prasada' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'GBP',
    price: '75.00',
    priceValidUntil: '2027-12-31',
    availability: 'https://schema.org/InStock',
    url: 'https://sreesvadistaprasada.com/subscriptions',
  },
  areaServed: [
    { '@type': 'City', name: 'Milton Keynes' },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SubscriptionsClient />
      {/* Server-rendered content — visible twin of what used to be sr-only */}
      <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-3xl mx-auto space-y-8 text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
          <div>
            <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Dabba Wala — a weekly South Indian meal subscription in Milton Keynes
            </h1>
            <p>
              Fresh Andhra and Telugu dishes delivered to your door every week across
              Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley,
              Westcroft, Emerson Valley and all MK postcodes (MK1–MK19).
              Edinburgh and Glasgow subscriptions are coming soon — join the waitlist.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>What&apos;s in your dabba</h2>
            <p>
              Rice, dal, sabzi, curry, pickle and papad — a complete home-style South
              Indian meal, packed fresh and delivered hot. No MSG. No preservatives.
              Traditional Andhra and Telugu recipes, every day. Choose Prasada (pure veg),
              Svadista (non-veg) or a Mixed weekly box, or save with the monthly plan.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>How it works</h2>
            <p>
              Choose your plan, pick your delivery days, and we cook fresh and deliver to
              your door. Pause or cancel anytime — no lock-in, no penalties.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
