import SnacksClient from './SnacksClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Buy Indian Snacks Online UK | Andhra Pickles & Savouries | Sree Svadista Prasada',
  description: 'Buy Indian snacks online UK — handmade Andhra pickles, traditional savouries & chutneys with fast UK-wide delivery. No preservatives, small batch. Shop now.',
  keywords: ['buy Indian snacks online UK', 'South Indian sweets online UK', 'Andhra pickles online UK', 'Indian savouries delivery UK', 'buy mango pickle online', 'Gongura pickle online UK', 'authentic mango avakaya pickle', 'Kandi Podi online UK'],
  openGraph: {
    title: 'Buy Indian Snacks Online UK | Andhra Pickles & Savouries',
    description: 'Buy Indian snacks online UK — handmade Andhra pickles, traditional savouries & chutneys with fast UK-wide delivery. No preservatives, small batch. Shop now.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Indian Snacks Online UK | Andhra Pickles & Savouries',
    description: 'Buy Indian snacks online UK — handmade Andhra pickles, traditional savouries & chutneys with fast UK-wide delivery. No preservatives, small batch. Shop now.',
  },
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
