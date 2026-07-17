import RagiClient from './RagiClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Ragi & Millet Specials Milton Keynes | Sree Svadista Prasada' },
  description: 'Ragi Specials Milton Keynes — finger millet dishes including Ragi Sangati, Ragi Dosa & Ragi Malt. Nutritious traditional South Indian superfoods. Order now.',
  keywords: ['ragi food Milton Keynes', 'finger millet delivery UK', 'ragi sangati near me', 'South Indian healthy food Milton Keynes', 'ragi dosa delivery', 'millet food delivery UK'],
  openGraph: {
    title: 'Ragi & Millet Specials Milton Keynes | Sree Svadista Prasada',
    description: 'Ragi Specials Milton Keynes — finger millet dishes including Ragi Sangati, Ragi Dosa & Ragi Malt. Nutritious traditional South Indian superfoods. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/ragi-specials',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=1200&q=80', width: 1200, height: 630, alt: 'Ragi & Millet Specials Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ragi & Millet Specials Milton Keynes | Sree Svadista Prasada',
    description: 'Ragi Specials Milton Keynes — finger millet dishes including Ragi Sangati, Ragi Dosa & Ragi Malt. Nutritious traditional South Indian superfoods. Order now.',
    images: ['https://images.unsplash.com/photo-1743615467363-250466982515?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/ragi-specials' },
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
  return (
    <>
      <h1 className="sr-only">Ragi & Millet Specials Milton Keynes — Healthy South Indian Superfoods</h1>
      <RagiClient initialItems={initialItems} />
    </>
  );
}
