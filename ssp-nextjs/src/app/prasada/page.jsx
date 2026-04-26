import PrasadaClient from './PrasadaClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Prasada — Pure Vegetarian South Indian Menu',
  description: 'Explore our pure vegetarian menu: dosas, idlis, veg curries, biryanis, Indo-Chinese and sacred Naivedyam offerings. Freshly cooked in Milton Keynes, delivered to Edinburgh & Glasgow.',
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=veg&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function PrasadaPage() {
  const initialItems = await getItems();
  return <PrasadaClient initialItems={initialItems} initialTab="Bites & Starters" />;
}
