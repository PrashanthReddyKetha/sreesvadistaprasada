import HomeClient from './HomeClient';

export const metadata = {
  title: { absolute: 'Indian Takeaway Milton Keynes | Authentic South Indian Food Delivery | Sree Svadista Prasada' },
  description: 'Indian takeaway Milton Keynes — authentic Andhra curries, dosas, biryanis & Dabba Wala tiffin subscriptions. Home-style South Indian food delivery. Order online.',
  keywords: 'Indian takeaway Milton Keynes, Indian food delivery Milton Keynes, South Indian restaurant Milton Keynes, best Indian restaurant MK, South Indian food Milton Keynes, home cooked Indian food delivery MK, authentic South Indian food near me',
  openGraph: {
    title: 'Indian Takeaway Milton Keynes | Authentic South Indian Food Delivery',
    description: 'Indian takeaway Milton Keynes — authentic Andhra curries, dosas, biryanis & Dabba Wala tiffin subscriptions. Home-style South Indian food delivery. Order online.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Restaurant',
      '@id': 'https://www.sreesvadistaprasada.com/#restaurant',
      name: 'Sree Svadista Prasada',
      description: 'Authentic South Indian home-style cooking — grandmother\'s recipes, slow tadkas, and the patient kind of love that fills a house with aroma.',
      url: 'https://www.sreesvadistaprasada.com',
      telephone: '+447307119962',
      email: 'info@sreesvadistaprasada.com',
      image: 'https://www.sreesvadistaprasada.com/logo.png',
      logo: 'https://www.sreesvadistaprasada.com/logo.png',
      priceRange: '££',
      servesCuisine: ['South Indian', 'Andhra', 'Telugu', 'Indian', 'Vegetarian', 'Vegan', 'Halal'],
      knowsAbout: ['Gongura', 'Andhra cuisine', 'Telugu food', 'Dabba Wala', 'Ragi', 'Pulihora', 'Avakaya', 'Chicken 65', 'Gutti Vankaya'],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '94',
        bestRating: '5',
        worstRating: '1',
      },
      hasMap: 'https://maps.google.com/?q=Milton+Keynes',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '24 Oxman Ln',
        addressLocality: 'Greenleys, Milton Keynes',
        addressRegion: 'Buckinghamshire',
        postalCode: 'MK12 6LF',
        addressCountry: 'GB',
      },
      areaServed: [
        { '@type': 'City', name: 'Milton Keynes' },
        { '@type': 'City', name: 'Edinburgh' },
        { '@type': 'City', name: 'Glasgow' },
      ],
      sameAs: [
        'https://www.instagram.com/sreesvadistaprasada/',
        'https://www.facebook.com/sreesvadistaprasada',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'South Indian Menu',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'MenuItem', name: 'Prasada — Pure Vegetarian Menu', url: 'https://www.sreesvadistaprasada.com/prasada' } },
          { '@type': 'Offer', itemOffered: { '@type': 'MenuItem', name: 'Svadista — Non-Vegetarian Menu', url: 'https://www.sreesvadistaprasada.com/svadista' } },
          { '@type': 'Offer', itemOffered: { '@type': 'MenuItem', name: 'Dabba Wala Weekly Subscription', url: 'https://www.sreesvadistaprasada.com/subscriptions' } },
        ],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.sreesvadistaprasada.com/#website',
      url: 'https://www.sreesvadistaprasada.com',
      name: 'Sree Svadista Prasada',
      publisher: { '@id': 'https://www.sreesvadistaprasada.com/#restaurant' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Indian Takeaway Milton Keynes — Authentic South Indian Food Delivery</h1>
      <HomeClient />
    </>
  );
}
