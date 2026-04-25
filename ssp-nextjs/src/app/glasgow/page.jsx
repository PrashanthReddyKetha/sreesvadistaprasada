import CityPage from '@/components/CityPage';

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export const metadata = {
  title: 'South Indian Food Delivery in Glasgow | Sree Svadista Prasada',
  description: 'Authentic South Indian food delivery across Glasgow — Pollokshields, Shawlands, Govanhill, Southside Glasgow, Finnieston, West End, Partick, Merchant City and all G postcodes. Halal non-veg, pure veg Prasada, Dabba Wala meal subscriptions.',
  alternates: { canonical: `${BASE_URL}/glasgow` },
};

const data = {
  city: 'Glasgow',
  tagline: 'Slow-cooked Andhra and Telugu food delivered to Pollokshields, Shawlands, Govanhill, Finnieston, West End and across Glasgow in 45–75 minutes.',
  deliveryTime: '45–75 minutes',
  minOrder: '£15',
  freeDeliveryThreshold: '£30',
  isKitchen: false,
  areas: [
    'Pollokshields', 'Shawlands', 'Govanhill', 'Southside Glasgow',
    'Finnieston', 'West End', 'Partick', 'Merchant City',
    'Dennistoun', 'Maryhill', 'Hillhead', 'Byres Road',
    'East End', 'Springburn', 'Govan', 'City Centre',
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
