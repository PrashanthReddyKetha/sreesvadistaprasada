import SnacksClient from './SnacksClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Hot, Sweet & Pickles — South Indian Condiments & Snacks',
  description: 'Handmade South Indian pickles, podis and snacks: mango pickle, gongura pickle, gun powder podi, murukku and more. Order in Milton Keynes, Edinburgh & Glasgow.',
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const [pickles, podis] = await Promise.all([
      fetch(`${BASE}/api/menu?category=pickles&available=true`, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() : []),
      fetch(`${BASE}/api/menu?category=podis&available=true`, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() : []),
    ]);
    return [...pickles, ...podis];
  } catch { return []; }
}

export default async function SnacksPage() {
  const initialItems = await getItems();
  return <SnacksClient initialItems={initialItems} initialTab="All" />;
}
