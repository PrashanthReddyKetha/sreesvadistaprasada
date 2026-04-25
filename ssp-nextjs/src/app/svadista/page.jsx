import SvadistaClient from './SvadistaClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Svadista — Non-Vegetarian South Indian Menu',
  description: 'Authentic non-veg South Indian dishes: Gongura Chicken, Natu Kodi Biryani, Mutton Curry, Egg specials and more. Cooked fresh in Milton Keynes, delivered to Edinburgh & Glasgow.',
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=nonVeg&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function SvadistaPage() {
  const initialItems = await getItems();
  return <SvadistaClient initialItems={initialItems} initialTab="All" />;
}
