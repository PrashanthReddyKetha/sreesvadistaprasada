import CityPage from '@/components/CityPage';
import { faqSchema } from '@/components/FaqSection';

const BASE_URL = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'South Indian Food Delivery Milton Keynes | Sree Svadista Prasada' },
  description: 'Authentic South Indian food delivery across Milton Keynes — Wolverton, Stony Stratford, Bletchley and all MK postcodes. Dabba Wala tiffins from £12.50/meal.',
  alternates: { canonical: `${BASE_URL}/milton-keynes` },
  openGraph: {
    title: 'South Indian Food Delivery Milton Keynes | Sree Svadista Prasada',
    description: 'Authentic Andhra curries, dosas & Dabba Wala subscriptions delivered across Milton Keynes.',
    type: 'website',
    url: `${BASE_URL}/milton-keynes`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian food delivery Milton Keynes' }],
  },
};

// Rendered visibly by CityPage AND used for the FAQPage schema — Google
// requires FAQ rich-result content to appear on the page.
const FAQS = [
  { q: 'What South Indian restaurants deliver in Milton Keynes?', a: 'Sree Svadista Prasada is a dedicated authentic Andhra South Indian kitchen in Milton Keynes. We deliver across all MK postcodes (MK1–MK19) including Wolverton, Stony Stratford, Bletchley, Newport Pagnell, Central MK, and surrounding areas.' },
  { q: 'How long does South Indian food delivery take in Milton Keynes?', a: 'Delivery across Milton Keynes takes 30–60 minutes from our Greenleys kitchen. Free delivery kicks in from £28–£40 depending on your zone.' },
  { q: 'What is the Dabba Wala meal subscription in Milton Keynes?', a: 'Dabba Wala is our weekly South Indian tiffin subscription service — fresh home-style meals delivered to your door in Milton Keynes from £12.50 per meal. Choose from Prasada (pure veg), Svadista (non-veg), or Mixed boxes.' },
  { q: 'Do you deliver South Indian food to Wolverton and Stony Stratford?', a: 'Yes — we deliver to all areas of Milton Keynes including Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley, Westcroft, Central MK, Emerson Valley, Shenley Brook End, Walnut Tree, Monkston, and more.' },
];

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
  faqs: FAQS,
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Sree Svadista Prasada',
    description: 'Authentic South Indian takeaway based in Milton Keynes. Delivering dosas, biryani, curries, Dabba Wala subscriptions across Milton Keynes.',
    url: `${BASE_URL}/milton-keynes`,
    telephone: '+447307119962',
    email: 'info@sreesvadistaprasada.com',
    image: `${BASE_URL}/logo.png`,
    priceRange: '££',
    servesCuisine: ['South Indian', 'Andhra', 'Telugu', 'Indian', 'Vegetarian', 'Vegan'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '24 Oxman Ln',
      addressLocality: 'Greenleys, Milton Keynes',
      addressRegion: 'Buckinghamshire',
      postalCode: 'MK12 6LF',
      addressCountry: 'GB',
    },
    // MK12 6LF postcode centroid (ONS via postcodes.io)
    geo: { '@type': 'GeoCoordinates', latitude: 52.05313, longitude: -0.828507 },
    areaServed: { '@type': 'City', name: 'Milton Keynes' },
    hasMap: 'https://maps.google.com/?q=24+Oxman+Ln,+Greenleys,+Milton+Keynes+MK12+6LF',
    sameAs: ['https://sreesvadistaprasada.com'],
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '11:00', closes: '22:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday'], opens: '10:00', closes: '23:00' },
    ],
  },
  faqSchema(FAQS),
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Milton Keynes', item: `${BASE_URL}/milton-keynes` },
    ],
  },
];

export default function MiltonKeynesPage() {
  return <CityPage data={data} jsonLd={jsonLd} />;
}
