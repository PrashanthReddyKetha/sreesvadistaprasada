import MenuClient from './MenuClient';

export const revalidate = 3600;

const OG_IMAGE = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80';

export const metadata = {
  title: 'Full South Indian Menu — 170+ Dishes',
  description: 'Browse 170+ authentic South Indian dishes — Gongura Chicken, Natu Kodi Biryani, dosas, Pulihora and Ragi Specials. Order online in Milton Keynes.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/menu' },
  openGraph: {
    title: 'Full South Indian Menu — 170+ Dishes | Sree Svadista Prasada',
    description: 'Browse 170+ authentic South Indian dishes — Gongura Chicken, Natu Kodi Biryani, dosas, Pulihora and Ragi Specials. Order online in Milton Keynes.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/menu',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Full South Indian menu — Sree Svadista Prasada' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Full South Indian Menu — 170+ Dishes | Sree Svadista Prasada',
    description: 'Browse 170+ authentic South Indian dishes. Order online in Milton Keynes.',
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: 'Full Menu — Sree Svadista Prasada',
  url: 'https://sreesvadistaprasada.com/menu',
  hasMenuSection: [
    { '@type': 'MenuSection', name: 'Prasada', description: 'Pure vegetarian South Indian dishes', url: 'https://sreesvadistaprasada.com/prasada' },
    { '@type': 'MenuSection', name: 'Svadista', description: 'Non-vegetarian South Indian dishes', url: 'https://sreesvadistaprasada.com/svadista' },
    { '@type': 'MenuSection', name: 'Breakfast', description: 'South Indian breakfast — idli, vada, dosas, poori', url: 'https://sreesvadistaprasada.com/breakfast' },
    { '@type': 'MenuSection', name: 'Street Food', description: 'South Indian street food and chaat', url: 'https://sreesvadistaprasada.com/street-food' },
    { '@type': 'MenuSection', name: 'Ragi Specials', description: 'Ragi-based health foods unique to our menu', url: 'https://sreesvadistaprasada.com/ragi-specials' },
    { '@type': 'MenuSection', name: 'Hot, Sweet & Pickles', description: 'Handmade pickles, podis and snacks — ships UK-wide', url: 'https://sreesvadistaprasada.com/snacks' },
    { '@type': 'MenuSection', name: 'Drinks', description: 'South Indian drinks and beverages', url: 'https://sreesvadistaprasada.com/drinks' },
  ],
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
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
      <MenuClient initialItems={initialItems} />
    </>
  );
}
