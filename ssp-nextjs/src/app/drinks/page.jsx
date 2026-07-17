import DrinksClient from './DrinksClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Mango Lassi Milton Keynes | Traditional Indian Drinks & Juices',
  description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
  keywords: ['mango lassi Milton Keynes', 'Indian drinks Milton Keynes', 'lassi delivery near me', 'masala buttermilk delivery MK', 'fresh juice delivery Milton Keynes', 'Indian beverages online UK'],
  openGraph: {
    title: 'Mango Lassi Milton Keynes | Traditional Indian Drinks & Juices',
    description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mango Lassi Milton Keynes | Traditional Indian Drinks & Juices',
    description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
  },
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
  return <DrinksClient initialItems={initialItems} />;
}
