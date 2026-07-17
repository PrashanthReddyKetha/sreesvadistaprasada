import StreetFoodClient from './StreetFoodClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Indian Street Food & Pani Puri Milton Keynes | Sree Svadista Prasada' },
  description: 'Indian street food Milton Keynes — pani puri, crispy chaat, chicken momos & Gobi Manchurian. Real Hyderabad & Mumbai street flavours to your door.',
  keywords: ['Indian street food Milton Keynes', 'pani puri Milton Keynes', 'chaat delivery Milton Keynes', 'Indo Chinese food takeaway MK', 'chicken momos online', 'spicy gobi manchurian near me', 'punugulu street snacks delivery', 'best pav bhaji Milton Keynes'],
  openGraph: {
    title: 'Indian Street Food & Pani Puri Milton Keynes | Sree Svadista Prasada',
    description: 'Indian street food Milton Keynes — pani puri, crispy chaat, chicken momos & Gobi Manchurian. Real Hyderabad & Mumbai street flavours to your door.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/street-food',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=1200&q=80', width: 1200, height: 630, alt: 'Indian Street Food — Pani Puri & Chaat Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Street Food & Pani Puri Milton Keynes | Sree Svadista Prasada',
    description: 'Indian street food Milton Keynes — pani puri, crispy chaat, chicken momos & Gobi Manchurian. Real Hyderabad & Mumbai street flavours to your door.',
    images: ['https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/street-food' },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=streetFood&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function StreetFoodPage() {
  const initialItems = await getItems();
  return (
    <>
      <h1 className="sr-only">Indian Street Food Milton Keynes — Pani Puri, Chaat & More</h1>
      <StreetFoodClient initialItems={initialItems} />
    </>
  );
}
