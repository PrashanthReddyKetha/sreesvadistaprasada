import CityPage from '@/components/CityPage';

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export const metadata = {
  title: 'South Indian Food Delivery in Edinburgh | Sree Svadista Prasada',
  description: 'Authentic South Indian food delivery across Edinburgh — Leith, Marchmont, Newington, Bruntsfield, Tollcross, Morningside, Southside, Old Town, New Town, Portobello and all EH postcodes. Only Andhra kitchen in Edinburgh. Dabba Wala subscriptions available.',
  alternates: { canonical: `${BASE_URL}/edinburgh` },
};

const data = {
  city: 'Edinburgh',
  tagline: 'Edinburgh\'s only Andhra kitchen — delivering to Leith, Marchmont, Newington, Bruntsfield, Morningside and across the city in 45–75 minutes.',
  deliveryTime: '45–75 minutes',
  minOrder: '£15',
  freeDeliveryThreshold: '£30',
  isKitchen: false,
  areas: [
    'Leith', 'Marchmont', 'Newington', 'Bruntsfield',
    'Tollcross', 'Morningside', 'Southside Edinburgh', 'Old Town',
    'New Town', 'Portobello', 'Stockbridge', 'Haymarket',
    'Gorgie', 'Dalry', 'Corstorphine', 'Musselburgh',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  name: 'Sree Svadista Prasada',
  description: 'Authentic South Indian takeaway delivering across Edinburgh. Dosas, biryani, Gongura chicken, curries, and Dabba Wala weekly meal subscriptions.',
  url: `${BASE_URL}/edinburgh`,
  telephone: '+447307119962',
  email: 'info@sreesvadistaprasada.com',
  image: `${BASE_URL}/logo.png`,
  priceRange: '££',
  servesCuisine: ['South Indian', 'Indian', 'Vegetarian'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Edinburgh',
    addressRegion: 'Scotland',
    addressCountry: 'GB',
  },
  areaServed: { '@type': 'City', name: 'Edinburgh' },
  sameAs: ['https://www.sreesvadistaprasada.com'],
};

export default function EdinburghPage() {
  return <CityPage data={data} jsonLd={jsonLd} />;
}
