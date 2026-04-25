import CityPage from '@/components/CityPage';

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export const metadata = {
  title: 'South Indian Food Delivery in Milton Keynes | Sree Svadista Prasada',
  description: 'Authentic South Indian takeaway delivered in Milton Keynes. Order dosas, biryani, Gongura chicken, curries & more. Dabba Wala weekly meal plans from £7. Free delivery over £30.',
  alternates: { canonical: `${BASE_URL}/milton-keynes` },
};

const data = {
  city: 'Milton Keynes',
  tagline: 'Cooked fresh right here in our Milton Keynes kitchen and delivered to your door in 30–60 minutes.',
  deliveryTime: '30–60 minutes',
  minOrder: '£15',
  freeDeliveryThreshold: '£30',
  isKitchen: true,
  areas: [
    'Central MK', 'Bletchley', 'Newport Pagnell', 'Woburn Sands',
    'Stony Stratford', 'Wolverton', 'Olney', 'Buckingham',
    'Winslow', 'Fenny Stratford', 'Walnut Tree', 'Shenley Church End',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  name: 'Sree Svadista Prasada',
  description: 'Authentic South Indian takeaway based in Milton Keynes. Delivering dosas, biryani, curries, Dabba Wala subscriptions across Milton Keynes.',
  url: `${BASE_URL}/milton-keynes`,
  telephone: '+447307119962',
  email: 'info@sreesvadistaprasada.com',
  image: `${BASE_URL}/logo.png`,
  priceRange: '££',
  servesCuisine: ['South Indian', 'Indian', 'Vegetarian'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Milton Keynes',
    addressRegion: 'Buckinghamshire',
    addressCountry: 'GB',
  },
  areaServed: { '@type': 'City', name: 'Milton Keynes' },
  hasMap: 'https://maps.google.com/?q=Milton+Keynes',
  sameAs: ['https://www.sreesvadistaprasada.com'],
};

export default function MiltonKeynesPage() {
  return <CityPage data={data} jsonLd={jsonLd} />;
}
