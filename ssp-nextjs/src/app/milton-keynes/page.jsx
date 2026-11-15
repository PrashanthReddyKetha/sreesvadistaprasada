import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import { getOpeningHoursSpec, getDeliveryEnabled } from '@/lib/siteStatus';
import CityPage, { DELIVEROO_URL } from '@/components/CityPage';
import { faqSchema } from '@/components/FaqSection';

const BASE_URL = 'https://sreesvadistaprasada.com';

export const metadata = pageMeta('/milton-keynes', { image: `${BASE_URL}/hero/catering-spread.jpg` });

// Rendered visibly by CityPage AND used for the FAQPage schema — Google
// requires FAQ rich-result content to appear on the page. The answers follow
// the admin delivery switch: collection-only launch, delivery through
// Deliveroo meanwhile, website delivery "coming soon" (owner, 15 Nov 2026).
const faqsFor = (delivery) => [
  { q: 'Is there a South Indian restaurant in Milton Keynes for Telugu and Andhra food?', a: `Yes. Sree Svadista Prasada cooks authentic Telugu food from Andhra Pradesh — gongura chicken, pappu, pulusu, ragi sangati, dosa, idli and dum biryani. We are a takeaway kitchen rather than a dine-in restaurant: order online and collect from Greenleys${delivery ? ', or have it delivered across Milton Keynes' : ', or order delivery on Deliveroo'}.` },
  { q: 'Is there an Indian takeaway near Wolverton or Stony Stratford?', a: `Yes — our kitchen is in Greenleys (MK12), a few minutes from both Wolverton and Stony Stratford. Order online and collect in about 30 minutes with 10% off${delivery ? ', or have it delivered' : ''}.` },
  { q: 'Do you deliver South Indian food in Milton Keynes?', a: delivery
      ? 'Yes — we deliver across all MK postcodes (MK1–MK19) including Wolverton, Stony Stratford, Bletchley, Newport Pagnell and Central MK, in 30–60 minutes from our Greenleys kitchen.'
      : 'Delivery from our website is coming soon. Right now you can order delivery through Deliveroo, or order on our website and collect from Greenleys (MK12) with 10% off.' },
  { q: 'How long does collection take in Milton Keynes?', a: 'Every dish is cooked fresh when you order, so collection is usually about 30 minutes — or pick a 15-minute collection slot at checkout. We text you the moment your food is ready.' },
  { q: 'What is the Dabba Wala meal subscription in Milton Keynes?', a: 'Dabba Wala is our weekly South Indian tiffin subscription — fresh, traditional meals delivered to your home or workplace in Milton Keynes from £13.75 per meal. Choose a Prasada (pure veg) or Svadista (non-veg) box.' },
  { q: 'Which areas of Milton Keynes do you serve?', a: `We are in Greenleys and serve the whole of Milton Keynes — Wolverton, Stony Stratford, Newport Pagnell, Bletchley, Westcroft, Central MK, Emerson Valley, Shenley Brook End, Walnut Tree, Monkston and more. ${delivery ? 'Delivery covers every MK postcode.' : 'Collect from MK12, or check Deliveroo for delivery to your postcode.'}` },
];

const baseData = {
  city: 'Milton Keynes',
  heading: PAGE_SEO['/milton-keynes'].h1,
  minOrder: '£15',
  isKitchen: true,
  areas: [
    'Wolverton', 'Stony Stratford', 'Greenleys', 'Newport Pagnell',
    'Bletchley', 'Westcroft', 'Central MK', 'Emerson Valley',
    'Shenley Brook End', 'Walnut Tree', 'Monkston', 'Brinklow',
    'Furzton', 'Two Mile Ash', 'Bradwell Common', 'Loughton',
  ],
};

const taglineFor = (delivery) => delivery
  ? 'A South Indian takeaway kitchen in Greenleys, between Wolverton and Stony Stratford — authentic Andhra food in Milton Keynes, cooked fresh to order, delivered across the city in 30–60 minutes or ready to collect in about 30.'
  : 'A South Indian takeaway kitchen in Greenleys, between Wolverton and Stony Stratford — authentic Andhra food in Milton Keynes, cooked fresh to order. Collect from MK12 with 10% off, or order delivery on Deliveroo while website delivery is on its way.';

const baseJsonLd = (delivery) => [
  {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Sree Svadista Prasada',
    description: `Authentic South Indian takeaway in Greenleys, Milton Keynes — dosas, biryani, Andhra curries and Dabba Wala tiffin plans, cooked fresh to order. Collection with 10% off${delivery ? ' and delivery across Milton Keynes' : '; delivery through Deliveroo'}.`,
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
    sameAs: ['https://sreesvadistaprasada.com', DELIVEROO_URL],
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '08:00', closes: '23:00' },
    ],
  },
  faqSchema(faqsFor(delivery)),
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
  const [hours, delivery] = await Promise.all([getOpeningHoursSpec(), getDeliveryEnabled()]);
  const jsonLd = baseJsonLd(delivery).map(node => {
    if (!node.openingHoursSpecification) return node;
    const { openingHoursSpecification, ...rest } = node;
    return hours && hours.length ? { ...rest, openingHoursSpecification: hours } : rest;
  });
  const data = { ...baseData, delivery, tagline: taglineFor(delivery), faqs: faqsFor(delivery) };
  return <CityPage data={data} jsonLd={jsonLd} />;
}
