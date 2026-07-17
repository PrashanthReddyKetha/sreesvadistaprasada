import RagiClient from './RagiClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Ragi Specials Milton Keynes | Healthy South Indian Millet Food Delivery',
  description: 'Ragi Specials Milton Keynes — finger millet dishes including Ragi Sangati, Ragi Dosa & Ragi Malt. Nutritious traditional South Indian superfoods. Order now.',
  keywords: ['ragi food Milton Keynes', 'finger millet delivery UK', 'ragi sangati near me', 'South Indian healthy food Milton Keynes', 'ragi dosa delivery', 'millet food delivery UK'],
  openGraph: {
    title: 'Ragi Specials Milton Keynes | Healthy South Indian Millet Food',
    description: 'Ragi Specials Milton Keynes — finger millet dishes including Ragi Sangati, Ragi Dosa & Ragi Malt. Nutritious traditional South Indian superfoods. Order now.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ragi Specials Milton Keynes | Healthy South Indian Millet Food',
    description: 'Ragi Specials Milton Keynes — finger millet dishes including Ragi Sangati, Ragi Dosa & Ragi Malt. Nutritious traditional South Indian superfoods. Order now.',
  },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=ragiSpecials&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function RagiPage() {
  const initialItems = await getItems();
  return <RagiClient initialItems={initialItems} />;
}
