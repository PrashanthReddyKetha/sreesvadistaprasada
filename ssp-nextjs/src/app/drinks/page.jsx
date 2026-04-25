import DrinksClient from './DrinksClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Drinks — South Indian Beverages',
  description: 'Refreshing South Indian drinks: filter coffee, masala chai, buttermilk, lassi, fresh juices and traditional cooling beverages. Order in Milton Keynes, Edinburgh & Glasgow.',
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
