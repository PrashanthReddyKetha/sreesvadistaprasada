import MenuClient from './MenuClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Full Menu — All South Indian Dishes',
  description: 'Browse our complete South Indian menu: 170+ dishes across veg, non-veg, breakfast, street food, ragi specials, drinks, pickles and podis. Order online for delivery in Milton Keynes, Edinburgh & Glasgow.',
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function FullMenuPage() {
  const initialItems = await getItems();
  return <MenuClient initialItems={initialItems} />;
}
