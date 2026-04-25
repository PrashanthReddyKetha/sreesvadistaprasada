import CityPage from '@/components/CityPage';

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export const metadata = {
  title: 'South Indian Food Delivery in Milton Keynes | Sree Svadista Prasada',
  description: 'Authentic South Indian food delivery in Milton Keynes — Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley, Westcroft, Central MK and all MK postcodes. Halal non-veg, pure veg Prasada, Dabba Wala subscriptions from £7/meal.',
  alternates: { canonical: `${BASE_URL}/milton-keynes` },
};

const data = {
  city: 'Milton Keynes',
  tagline: 'Cooked fresh in our Greenleys kitchen and delivered to Wolverton, Stony Stratford, Newport Pagnell, Bletchley, Central MK and all MK postcodes in 30–60 minutes.',
  deliveryTime: '30–60 minutes',
  minOrder: '£15',
  freeDeliveryThreshold: '£30',
  isKitchen: true,
  areas: [
    'Wolverton', 'Stony Stratford', 'Greenleys', 'Newport Pagnell',
    'Bletchley', 'Westcroft', 'Central MK', 'Emerson Valley',
    'Shenley Brook End', 'Walnut Tree', 'Monkston', 'Brinklow',
    'Furzton', 'Two Mile Ash', 'Bradwell Common', 'Loughton',
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
