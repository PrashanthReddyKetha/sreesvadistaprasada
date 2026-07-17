import StreetFoodClient from './StreetFoodClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Indian Street Food Milton Keynes | Pani Puri & Chaat Delivery',
  description: 'Indian street food Milton Keynes — pani puri, crispy chaat, chicken momos & Gobi Manchurian. Real Hyderabad & Mumbai street flavours to your door.',
  keywords: ['Indian street food Milton Keynes', 'pani puri Milton Keynes', 'chaat delivery Milton Keynes', 'Indo Chinese food takeaway MK', 'chicken momos online', 'spicy gobi manchurian near me', 'punugulu street snacks delivery', 'best pav bhaji Milton Keynes'],
  openGraph: {
    title: 'Indian Street Food Milton Keynes | Pani Puri & Chaat Delivery',
    description: 'Indian street food Milton Keynes — pani puri, crispy chaat, chicken momos & Gobi Manchurian. Real Hyderabad & Mumbai street flavours to your door.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Street Food Milton Keynes | Pani Puri & Chaat Delivery',
    description: 'Indian street food Milton Keynes — pani puri, crispy chaat, chicken momos & Gobi Manchurian. Real Hyderabad & Mumbai street flavours to your door.',
  },
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
  return <StreetFoodClient initialItems={initialItems} />;
}
