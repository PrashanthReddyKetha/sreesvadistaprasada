import SeoSection from '@/components/SeoSection';
import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import MenuClient from './MenuClient';

export const revalidate = 3600;

const OG_IMAGE = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80';

export const metadata = pageMeta('/menu');

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: 'Full Menu — Sree Svadista Prasada',
  url: 'https://sreesvadistaprasada.com/menu',
  hasMenuSection: [
    { '@type': 'MenuSection', name: 'Prasada', description: 'Pure vegetarian South Indian dishes', url: 'https://sreesvadistaprasada.com/prasada' },
    { '@type': 'MenuSection', name: 'Svadista', description: 'Non-vegetarian South Indian dishes', url: 'https://sreesvadistaprasada.com/svadista' },
    { '@type': 'MenuSection', name: 'Breakfast', description: 'South Indian breakfast — idli, vada, dosas, poori', url: 'https://sreesvadistaprasada.com/breakfast' },
    { '@type': 'MenuSection', name: 'Street Food', description: 'Indian street food — pani puri, momos, chaat, wraps and burgers', url: 'https://sreesvadistaprasada.com/street-food' },
    { '@type': 'MenuSection', name: 'Ragi Specials', description: 'Ragi sangati, ragi malt and ragi buttermilk', url: 'https://sreesvadistaprasada.com/ragi-specials' },
    { '@type': 'MenuSection', name: 'Hot, Sweet & Pickles', description: 'Handmade Andhra pickles and podis — coming soon', url: 'https://sreesvadistaprasada.com/snacks' },
    { '@type': 'MenuSection', name: 'Drinks', description: 'South Indian drinks and beverages', url: 'https://sreesvadistaprasada.com/drinks' },
  ],
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

// Only the fields the card grid renders — full item objects doubled this
// page's HTML to ~700KB via the RSC flight payload.
const slim = (i) => ({
  id: i.id, name: i.name, slug: i.slug, description: i.description,
  price: i.price, image: i.image, is_veg: i.is_veg, spice_level: i.spice_level,
  category: i.category, subcategory: i.subcategory,
  preorder_only: i.preorder_only, sold_out_today: i.sold_out_today,
});

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const items = await res.json();
    return items.map(slim);
  } catch { return []; }
}

export default async function FullMenuPage() {
  const initialItems = await getItems();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MenuClient initialItems={initialItems} seoLine={PAGE_SEO['/menu'].h1} />
      <SeoSection heading={PAGE_SEO['/menu'].content.heading} paragraphs={PAGE_SEO['/menu'].content.paragraphs} links={PAGE_SEO['/menu'].content.links} />
    </>
  );
}
