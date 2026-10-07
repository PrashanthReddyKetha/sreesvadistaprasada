import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import { getOpeningHoursSpec } from '@/lib/siteStatus';
import CityPage from '@/components/CityPage';
import { faqSchema } from '@/components/FaqSection';

const BASE_URL = 'https://sreesvadistaprasada.com';

export const metadata = pageMeta('/milton-keynes', { image: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80' });

// Rendered visibly by CityPage AND used for the FAQPage schema — Google
// requires FAQ rich-result content to appear on the page.
const FAQS = [
  { q: 'Is there a South Indian restaurant in Milton Keynes for Telugu and Andhra food?', a: 'Yes. Sree Svadista Prasada cooks Telugu home food from Andhra Pradesh — gongura chicken, pappu, pulusu, ragi sangati, dosa, idli and dum biryani. We are a takeaway kitchen rather than a dine-in restaurant: order online for delivery across Milton Keynes or collection from Greenleys.' },
  { q: 'Is there an Indian takeaway near Wolverton or Stony Stratford?', a: 'Yes — our kitchen is in Greenleys (MK12), a few minutes from both Wolverton and Stony Stratford. Order online and collect, or have it delivered.' },
  { q: 'What South Indian restaurants deliver in Milton Keynes?', a: 'Sree Svadista Prasada is a dedicated authentic Andhra South Indian kitchen in Milton Keynes. We deliver across all MK postcodes (MK1–MK19) including Wolverton, Stony Stratford, Bletchley, Newport Pagnell, Central MK, and surrounding areas.' },
  { q: 'How long does South Indian food delivery take in Milton Keynes?', a: 'Delivery across Milton Keynes takes 30–60 minutes from our Greenleys kitchen. Free delivery kicks in from £28–£40 depending on your zone.' },
  { q: 'What is the Dabba Wala meal subscription in Milton Keynes?', a: 'Dabba Wala is our weekly South Indian tiffin subscription service — fresh home-style meals delivered to your door in Milton Keynes from £13.75 per meal. Choose a Prasada (pure veg) or Svadista (non-veg) box.' },
  { q: 'Do you deliver South Indian food to Wolverton and Stony Stratford?', a: 'Yes — we deliver to all areas of Milton Keynes including Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley, Westcroft, Central MK, Emerson Valley, Shenley Brook End, Walnut Tree, Monkston, and more.' },
];

const data = {
  city: 'Milton Keynes',
  heading: PAGE_SEO['/milton-keynes'].h1,
  tagline: 'A South Indian takeaway kitchen in Greenleys, between Wolverton and Stony Stratford — authentic Andhra food in Milton Keynes, cooked fresh and delivered across the city in 30–60 minutes, or ready to collect.',
  deliveryTime: '30–60 minutes',
  minOrder: '£15',
  freeDeliveryThreshold: 'From £28, by zone',
  isKitchen: true,
  areas: [
    'Wolverton', 'Stony Stratford', 'Greenleys', 'Newport Pagnell',
    'Bletchley', 'Westcroft', 'Central MK', 'Emerson Valley',
    'Shenley Brook End', 'Walnut Tree', 'Monkston', 'Brinklow',
    'Furzton', 'Two Mile Ash', 'Bradwell Common', 'Loughton',
  ],
  faqs: FAQS,
};

const baseJsonLd = [
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
    servesCuisine: ['South Indian', 'Andhra', 'Telugu', 'Indian', 'Vegetarian'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Greenleys, Milton Keynes',
      addressRegion: 'Buckinghamshire',
      addressCountry: 'GB',
    },
    areaServed: { '@type': 'City', name: 'Milton Keynes' },
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

export const revalidate = 600;

export default async function MiltonKeynesPage() {
  const hours = await getOpeningHoursSpec();
  const jsonLd = baseJsonLd.map(node => {
    if (!node.openingHoursSpecification) return node;
    const { openingHoursSpecification, ...rest } = node;
    return hours && hours.length ? { ...rest, openingHoursSpecification: hours } : rest;
  });
  return <CityPage data={data} jsonLd={jsonLd} />;
}
