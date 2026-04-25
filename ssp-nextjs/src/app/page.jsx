import HomeClient from './HomeClient';

export const metadata = {
  title: 'Sree Svadista Prasada | Authentic South Indian Food, Milton Keynes',
  description: 'Authentic South Indian takeaway in Milton Keynes, Edinburgh & Glasgow. Order Gongura Chicken, Pulihora, Natu Kodi Biryani, dosas and more online. Dabba Wala weekly meal subscriptions available.',
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
      servesCuisine: ['South Indian', 'Indian', 'Vegetarian', 'Vegan'],
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
      <HomeClient />
    </>
  );
}
