import StreetFoodClient from './StreetFoodClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Street Food — Indian Street Snacks & Chaats',
  description: 'Crispy, tangy South Indian street food: pani puri, bhel, pav bhaji, mirchi bajji and more. Delivered fresh in Milton Keynes, Edinburgh & Glasgow.',
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
