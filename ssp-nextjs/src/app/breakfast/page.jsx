import SeoSection from '@/components/SeoSection';
import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import BreakfastClient from './BreakfastClient';
import FaqSection, { faqSchema } from '@/components/FaqSection';

export const revalidate = 3600;

export const metadata = pageMeta('/breakfast', { image: 'https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80' });

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
  { q: 'What South Indian breakfast dishes do you serve?', a: 'We serve crispy Masala Dosa and a whole range of other dosas, Idli with fresh sambar, Medu Vada, Poori, Upma, Poha, Uggani and our signature Nellore Ghee Karam Dosa. All freshly prepared to order.' },
  { q: 'When is South Indian breakfast available?', a: 'Breakfast is cooked to order while the kitchen is open. Opening and collection times are set by the kitchen and shown live when you order. Dosas and idli are made from batter we ferment ourselves, never an instant mix.' },
  { q: 'Is your South Indian breakfast menu vegetarian?', a: 'Most of it is: idli, vada, dosas, poori, upma, poha and uggani are vegetarian. The breakfast menu also has dishes with egg, such as bread omelette, and combos with chicken curry — each dish is marked veg or non-veg. Vegetarian dishes are cooked with their own separate utensils, in the same kitchen as non-vegetarian food, and each dish lists its allergens.' },
  { q: 'Can I order South Indian breakfast for delivery in Milton Keynes?', a: 'Yes — order South Indian breakfast online for delivery across Milton Keynes or collection from Greenleys. Dosas are packed with their chutneys and sambar separately so they arrive as crisp as we can make them.' },
  { q: 'What is the difference between Masala Dosa and Karam Dosa?', a: 'Masala Dosa is filled with a mild spiced potato filling (aloo masala) and served with sambar and coconut chutney. Our Nellore Ghee Karam Dosa is spread with fiery Andhra karam (chilli-garlic paste) and finished with ghee. It is spicier and more intense.' },
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
      <BreakfastClient initialItems={initialItems} initialTab="Idli & Vada" />
      <SeoSection heading={PAGE_SEO['/breakfast'].content.heading} paragraphs={PAGE_SEO['/breakfast'].content.paragraphs} />
      <FaqSection title="South Indian breakfast — your questions" faqs={FAQS} links={SECTION_LINKS} linksTitle="Browse breakfast by section" />
    </>
  );
}
