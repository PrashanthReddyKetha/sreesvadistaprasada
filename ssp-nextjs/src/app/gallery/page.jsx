import GalleryClient from './GalleryClient';
import { buildItemUrl } from '@/lib/itemUrl';

export const revalidate = 3600;

export const metadata = {
  title: 'South Indian Food Gallery — Dishes & Kitchen',
  description: 'Every dish on our menu, photographed: biryanis, curries, dosas, and the kitchen that cooks them with love.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/gallery' },
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

// Menu category → gallery filter label (matches the site's brand names)
const CATEGORY_LABELS = {
  nonVeg: 'Svadista',
  veg: 'Prasada',
  breakfast: 'Breakfast',
  streetFood: 'Street Food',
  ragiSpecials: 'Ragi Specials',
  drinks: 'Drinks',
  pickles: "Lucky's Pantry",
  podis: "Lucky's Pantry",
};

// The gallery feeds itself from the live menu: every available item with a
// photo appears automatically — new dishes and photo swaps flow in on the
// next hourly regeneration, no manual curation.
async function getDishImages() {
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const items = await res.json();
    const seen = new Set();
    const images = [];
    for (const i of items) {
      if (!i.image || !i.image.startsWith('http')) continue;
      // Several items share placeholder photos — show each photo once
      if (seen.has(i.image)) continue;
      seen.add(i.image);
      images.push({
        id: `dish-${i.id}`,
        src: i.image,
        alt: i.name,
        category: CATEGORY_LABELS[i.category] || 'Svadista',
        href: buildItemUrl(i),
      });
    }
    return images;
  } catch { return []; }
}

export default async function Page() {
  const dishImages = await getDishImages();
  return <GalleryClient dishImages={dishImages} />;
}
