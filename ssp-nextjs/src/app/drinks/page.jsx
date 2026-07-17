import DrinksClient from './DrinksClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Mango Lassi & Indian Drinks Milton Keynes | Sree Svadista Prasada' },
  description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
  keywords: ['mango lassi Milton Keynes', 'Indian drinks Milton Keynes', 'lassi delivery near me', 'masala buttermilk delivery MK', 'fresh juice delivery Milton Keynes', 'Indian beverages online UK'],
  openGraph: {
    title: 'Mango Lassi & Indian Drinks Milton Keynes | Sree Svadista Prasada',
    description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/drinks',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1666251214695-405f673b396a?w=1200&q=80', width: 1200, height: 630, alt: 'Mango Lassi & Indian Drinks Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mango Lassi & Indian Drinks Milton Keynes | Sree Svadista Prasada',
    description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
    images: ['https://images.unsplash.com/photo-1666251214695-405f673b396a?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/drinks' },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=drinks&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function DrinksPage() {
  const initialItems = await getItems();
  return (
    <>
      <h1 className="sr-only">Mango Lassi & Indian Drinks Milton Keynes</h1>
      <DrinksClient initialItems={initialItems} />
    </>
  );
}
