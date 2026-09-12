import BreakfastClient from './BreakfastClient';
import FaqSection, { faqSchema } from '@/components/FaqSection';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'South Indian Breakfast Milton Keynes | Sree Svadista Prasada' },
  description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
  openGraph: {
    title: 'South Indian Breakfast Milton Keynes | Dosa, Idli & Vada | Sree Svadista Prasada',
    description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/breakfast',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian Breakfast — Dosa, Idli & Vada' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'South Indian Breakfast Milton Keynes | Sree Svadista Prasada',
    description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
    images: ['https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/breakfast' },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=breakfast&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// Rendered visibly below AND used for the FAQPage schema
const FAQS = [
  { q: 'What South Indian breakfast dishes do you serve?', a: 'We serve crispy Masala Dosa, Idli with fresh sambar, Medu Vada, Upma, Rava Kesari, Pongal, Filter Coffee, and our signature Karam Dosa. All freshly prepared to order.' },
  { q: 'When is South Indian breakfast available?', a: 'Breakfast is available every weekend from 8:00 AM and weekdays from 11:00 AM. All items are freshly prepared — no pre-made batters.' },
  { q: 'Is your South Indian breakfast menu vegetarian?', a: 'Yes, all breakfast dishes are vegetarian and most are vegan-friendly too. No meat or fish is used in our breakfast kitchen. Every item is clearly marked with dietary indicators on the menu.' },
  { q: 'Can I order South Indian breakfast for delivery in Milton Keynes?', a: 'Yes! We deliver hot South Indian breakfast across Milton Keynes. Dosas are packed with chutneys and sambar in insulated packaging to arrive as fresh as possible.' },
  { q: 'What is the difference between Masala Dosa and Karam Dosa?', a: 'Masala Dosa is filled with a mild spiced potato filling (aloo masala) and served with sambar and coconut chutney. Karam Dosa is our chef special — spread with fiery Andhra karam (chilli-garlic paste) and served with extra chutneys. It is spicier and more intense.' },
];

// Crawlable links to the subsection pages (the tab bar navigates by hash only)
const SECTION_LINKS = [
  { href: '/breakfast/idli-vada', label: 'Idli & Vada' },
  { href: '/breakfast/dosas', label: 'Dosas' },
  { href: '/breakfast/chicken-curry-combos', label: 'Chicken Curry Combos' },
  { href: '/breakfast/poori-others', label: 'Poori & Others' },
  { href: '/breakfast/english-breakfast', label: 'English Breakfast' },
];

export default async function BreakfastPage() {
  const initialItems = await getItems();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(FAQS)) }} />
      <h1 className="sr-only">South Indian Breakfast Milton Keynes — Dosa, Idli, Vada & More</h1>
      <BreakfastClient initialItems={initialItems} initialTab="Idli & Vada" />
      <FaqSection title="South Indian breakfast — your questions" faqs={FAQS} links={SECTION_LINKS} linksTitle="Browse breakfast by section" />
    </>
  );
}
