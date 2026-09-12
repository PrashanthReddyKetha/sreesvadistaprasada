import SvadistaClient from './SvadistaClient';
import FaqSection, { faqSchema } from '@/components/FaqSection';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Andhra Curries & Biryani Milton Keynes | Sree Svadista Prasada' },
  description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
  openGraph: {
    title: 'Andhra Curries & Biryani Milton Keynes | Sree Svadista Prasada',
    description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/svadista',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80', width: 1200, height: 630, alt: 'Andhra Curries & Biryani Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andhra Curries & Biryani Milton Keynes | Sree Svadista Prasada',
    description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
    images: ['https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/svadista' },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=nonVeg&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// Rendered visibly below AND used for the FAQPage schema
const FAQS = [
  { q: 'What are the most popular non-veg dishes?', a: 'Our most loved dishes are Natu Kodi Biryani (slow-cooked country chicken in basmati), Gongura Chicken (tangy sorrel leaf curry), Rayalaseema Mutton Curry, and Chicken 65. Every recipe is authentic Andhra home-style cooking.' },
  { q: 'How spicy is Andhra food?', a: 'Andhra cuisine is known for bold, fiery flavours. Our dishes are prepared to traditional spice levels. You can request a milder preparation in the special instructions when ordering.' },
  { q: 'Do you deliver non-veg Indian food to Edinburgh and Glasgow?', a: 'Not yet — we currently deliver across Milton Keynes only. Edinburgh and Glasgow are coming soon; join the waitlist to be notified when we launch there.' },
  { q: 'What makes Svadista different from other Indian takeaways?', a: 'Svadista means delicious in Sanskrit. Unlike generic Indian takeaways, every Svadista dish uses regional Andhra Telugu recipes — slow-cooked gravies, whole spice tadkas, and cuts of meat specific to traditional preparations like natu kodi (country chicken).' },
];

// Crawlable links to the subsection pages (the tab bar navigates by hash only)
const SECTION_LINKS = [
  { href: '/svadista/starters', label: 'Starters' },
  { href: '/svadista/curries', label: 'Curries' },
  { href: '/svadista/biriyani', label: 'Biriyani' },
  { href: '/svadista/rice-bowls', label: 'Rice Bowls' },
  { href: '/svadista/egg-specials', label: 'Egg Specials' },
  { href: '/svadista/indo-chinese', label: 'Indo-Chinese' },
];

export default async function SvadistaPage() {
  const initialItems = await getItems();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(FAQS)) }} />
      <h1 className="sr-only">Non-Veg Indian Food Milton Keynes — Andhra Curries, Biryani & More</h1>
      <SvadistaClient initialItems={initialItems} initialTab="Starters" />
      <FaqSection title="Svadista non-veg menu — your questions" faqs={FAQS} links={SECTION_LINKS} linksTitle="Browse Svadista by section" />
    </>
  );
}
