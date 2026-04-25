import CityPage from '@/components/CityPage';

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export const metadata = {
  title: 'South Indian Food Delivery in Edinburgh | Sree Svadista Prasada',
  description: 'Authentic South Indian takeaway delivered across Edinburgh. Order dosas, Gongura chicken, biryani, curries & Dabba Wala weekly meal plans. Free delivery over £30.',
  alternates: { canonical: `${BASE_URL}/edinburgh` },
};

const data = {
  city: 'Edinburgh',
  tagline: 'Grandmother\'s recipes from our kitchen — Andhra flavours delivered fresh across Edinburgh in 45–75 minutes.',
  deliveryTime: '45–75 minutes',
  minOrder: '£15',
  freeDeliveryThreshold: '£30',
  isKitchen: false,
  areas: [
    'City Centre', 'Leith', 'Morningside', 'Portobello',
    'Stockbridge', 'Bruntsfield', 'Newington', 'Corstorphine',
    'Tollcross', 'Marchmont', 'Gorgie', 'Murrayfield',
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
