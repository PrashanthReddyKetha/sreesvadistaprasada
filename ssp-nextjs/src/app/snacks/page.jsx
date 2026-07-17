import SnacksClient from './SnacksClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Andhra Pickles & Indian Snacks Online UK | Sree Svadista Prasada' },
  description: 'Buy Indian snacks online UK — handmade Andhra pickles, traditional savouries & chutneys with fast UK-wide delivery. No preservatives, small batch. Shop now.',
  keywords: ['buy Indian snacks online UK', 'South Indian sweets online UK', 'Andhra pickles online UK', 'Indian savouries delivery UK', 'buy mango pickle online', 'Gongura pickle online UK', 'authentic mango avakaya pickle', 'Kandi Podi online UK'],
  openGraph: {
    title: 'Andhra Pickles & Indian Snacks Online UK | Sree Svadista Prasada',
    description: 'Buy Indian snacks online UK — handmade Andhra pickles, traditional savouries & chutneys with fast UK-wide delivery. No preservatives, small batch. Shop now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/snacks',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1680529672551-16132239d69b?w=1200&q=80', width: 1200, height: 630, alt: 'Andhra Pickles & Indian Snacks Online UK' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andhra Pickles & Indian Snacks Online UK | Sree Svadista Prasada',
    description: 'Buy Indian snacks online UK — handmade Andhra pickles, traditional savouries & chutneys with fast UK-wide delivery. No preservatives, small batch. Shop now.',
    images: ['https://images.unsplash.com/photo-1680529672551-16132239d69b?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/snacks' },
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
  return (
    <>
      <h1 className="sr-only">Andhra Pickles & Indian Snacks Online UK</h1>
      <SnacksClient initialItems={initialItems} initialTab="All" />
    </>
  );
}
