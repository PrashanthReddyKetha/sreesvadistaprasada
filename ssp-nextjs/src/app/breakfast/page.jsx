import BreakfastClient from './BreakfastClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Breakfast — South Indian Morning Classics',
  description: 'Start your day the South Indian way: idli, dosa, upma, poha, pesarattu, vada and more. Hot breakfast delivered in Milton Keynes, Edinburgh & Glasgow.',
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=breakfast&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function BreakfastPage() {
  const initialItems = await getItems();
  return <BreakfastClient initialItems={initialItems} initialTab="All" />;
}
