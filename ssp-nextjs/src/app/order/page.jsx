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
  preorder_only: i.preorder_only, sold_out_today: i.sold_out_today,
});

async function getMenu() {
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const items = await res.json();
    return items.map(slim);
  } catch { return []; }
}

export const metadata = {
  title: { absolute: 'Order Online | Sree Svadista Prasada' },
  description:
    'Order authentic Andhra food for collection or delivery in Milton Keynes. Pick your collection time, pay securely, and collect fresh from our kitchen.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/order' },
  // Transactional funnel page duplicating /menu's content — keep it for
  // people and out of the index; /menu is the page that should rank.
  robots: { index: false, follow: true },
};

export default async function OrderPage() {
  const initialItems = await getMenu();
  return <Suspense fallback={null}><OrderClient initialItems={initialItems} /></Suspense>;
}
