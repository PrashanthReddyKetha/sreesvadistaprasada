import CityPage from '@/components/CityPage';

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export const metadata = {
  title: 'South Indian Food Delivery in Glasgow | Sree Svadista Prasada',
  description: 'Authentic South Indian takeaway delivered across Glasgow. Order dosas, Gongura chicken, biryani, curries & Dabba Wala weekly meal plans. Free delivery over £30.',
  alternates: { canonical: `${BASE_URL}/glasgow` },
};

const data = {
  city: 'Glasgow',
  tagline: 'Traditional Andhra cooking, slow-cooked and delivered to your Glasgow door in 45–75 minutes.',
  deliveryTime: '45–75 minutes',
  minOrder: '£15',
  freeDeliveryThreshold: '£30',
  isKitchen: false,
  areas: [
    'City Centre', 'West End', 'Southside', 'East End',
    'Partick', 'Shawlands', 'Finnieston', 'Govan',
    'Dennistoun', 'Pollokshields', 'Hillhead', 'Maryhill',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  name: 'Sree Svadista Prasada',
  description: 'Authentic South Indian takeaway delivering across Glasgow. Dosas, biryani, Gongura chicken, curries, and Dabba Wala weekly meal subscriptions.',
  url: `${BASE_URL}/glasgow`,
  telephone: '+447307119962',
  email: 'info@sreesvadistaprasada.com',
  image: `${BASE_URL}/logo.png`,
  priceRange: '££',
  servesCuisine: ['South Indian', 'Indian', 'Vegetarian'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Glasgow',
    addressRegion: 'Scotland',
    addressCountry: 'GB',
  },
  areaServed: { '@type': 'City', name: 'Glasgow' },
  sameAs: ['https://www.sreesvadistaprasada.com'],
};

export default function GlasgowPage() {
  return <CityPage data={data} jsonLd={jsonLd} />;
}
