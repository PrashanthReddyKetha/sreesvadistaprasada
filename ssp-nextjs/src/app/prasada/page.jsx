import PrasadaClient from './PrasadaClient';
import FaqSection, { faqSchema } from '@/components/FaqSection';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Pure Veg South Indian Food Milton Keynes | Sree Svadista Prasada' },
  description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
  openGraph: {
    title: 'Pure Veg South Indian Food Milton Keynes | Sree Svadista Prasada',
    description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/prasada',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?w=1200&q=80', width: 1200, height: 630, alt: 'Pure Veg South Indian Food Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pure Veg South Indian Food Milton Keynes | Sree Svadista Prasada',
    description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
    images: ['https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/prasada' },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=veg&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// Rendered visibly below AND used for the FAQPage schema
const FAQS = [
  { q: 'Is the Prasada menu 100% vegetarian?', a: 'Yes. The Prasada menu is entirely plant-based — no meat, fish, or eggs. Every dish is cooked in a dedicated pure-veg kitchen using fresh vegetables, lentils, and traditional Andhra spices.' },
  { q: 'Do you offer vegan options on the Prasada menu?', a: 'Yes, many Prasada dishes are naturally vegan. Items using ghee, yoghurt, or paneer are clearly labelled on the menu. Contact us if you need a fully vegan meal.' },
  { q: 'Can I order Prasada dishes for delivery in Milton Keynes?', a: 'Yes! We deliver pure veg South Indian food across Milton Keynes including Greenleys, Wolverton, Stony Stratford, Central MK, and Bletchley. Enter your postcode at checkout to confirm your delivery zone.' },
  { q: 'What makes Prasada food different from regular vegetarian Indian food?', a: "Prasada means divine offering. Our recipes follow the tradition of South Indian temple cooking — pure ingredients, slow-cooked dals, hand-ground chutneys, and grandmother's recipes with no shortcuts." },
  { q: 'Is there a minimum order for Prasada delivery?', a: 'Yes, a minimum order of £15 applies for delivery. Collection orders have no minimum. You can also schedule a pickup time at checkout.' },
];

// Crawlable links to the subsection pages (the tab bar navigates by hash only)
const SECTION_LINKS = [
  { href: '/prasada/bites-starters', label: 'Bites & Starters' },
  { href: '/prasada/curries', label: 'Curries' },
  { href: '/prasada/biriyanis-rice', label: 'Biriyanis & Rice' },
  { href: '/prasada/thalis-rice-bowls', label: 'Thalis & Rice Bowls' },
  { href: '/prasada/indo-chinese', label: 'Indo Chinese' },
  { href: '/prasada/naivedyam', label: 'Naivedyam' },
];

export default async function PrasadaPage() {
  const initialItems = await getItems();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(FAQS)) }} />
      <h1 className="sr-only">Pure Veg South Indian Food Milton Keynes — Temple-Style Andhra Cooking</h1>
      <PrasadaClient initialItems={initialItems} initialTab="Bites & Starters" />
      <FaqSection title="Prasada pure-veg menu — your questions" faqs={FAQS} links={SECTION_LINKS} linksTitle="Browse Prasada by section" />
    </>
  );
}
