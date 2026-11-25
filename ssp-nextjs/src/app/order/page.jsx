import { Suspense } from 'react';
import OrderClient from './OrderClient';

// ISR: bake the menu into the page so the list paints instantly with zero
// layout shift; refreshed in the background every 5 minutes
export const revalidate = 300;

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

// Only the fields the order list actually renders — the full objects (faqs,
// SEO text, pairs_with, galleries…) were being serialized twice per item
// (HTML + RSC flight data), pushing this page's HTML past 700KB.
const slim = (i) => ({
  id: i.id, name: i.name, slug: i.slug, description: i.description,
  price: i.price, image: i.image, is_veg: i.is_veg, spice_level: i.spice_level,
  category: i.category, subcategory: i.subcategory, allergens: i.allergens,
  preorder_only: i.preorder_only, sold_out_today: i.sold_out_today, coming_soon: i.coming_soon, sold_out_until: i.sold_out_until,
});

async function getMenu() {
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const items = await res.json();
    return items.map(slim);
  } catch { return []; }
}

// Today's specials are the dishes picked in Admin › Daily Specials; baked in so the strip does not pop in late
async function getSpecialIds() {
  try {
    const res = await fetch(`${BASE}/api/daily-specials`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()).map(s => s.menu_item_id).filter(Boolean);
  } catch { return []; }
}

export const metadata = {
  title: { absolute: 'Order Online | Sree Svadista Prasada' },
  description:
    'Order authentic Andhra food in Milton Keynes. Today\'s menu is ready in about 30 minutes; everything else can be pre-ordered for tomorrow. Pick your collection time and pay securely.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/order' },
  // Transactional funnel page duplicating /menu's content — keep it for
  // people and out of the index; /menu is the page that should rank.
  robots: { index: false, follow: true },
};

export default async function OrderPage() {
  const [initialItems, initialSpecialIds] = await Promise.all([getMenu(), getSpecialIds()]);
  return <Suspense fallback={null}><OrderClient initialItems={initialItems} initialSpecialIds={initialSpecialIds} /></Suspense>;
}
