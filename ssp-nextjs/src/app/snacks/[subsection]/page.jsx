import { notFound } from 'next/navigation';
import SnacksClient from '../SnacksClient';

export const revalidate = 3600;

const SLUG_TO_TAB = {
  'pickles': 'Pickles',
  'podis':   'Podis',
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const [pickles, podis] = await Promise.all([
      fetch(`${BASE}/api/menu?category=pickles&available=true`, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() : []),
      fetch(`${BASE}/api/menu?category=podis&available=true`, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() : []),
    ]);
    return [...pickles, ...podis];
  } catch { return []; }
}

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_TAB).map(subsection => ({ subsection }));
}

export async function generateMetadata({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) return {};
  return {
    title: `${tab} — Hot, Sweet & Pickles | Sree Svadista Prasada`,
    description: `Authentic South Indian ${tab.toLowerCase()} — handmade with traditional recipes. Order online for delivery across Milton Keynes, Edinburgh & Glasgow.`,
  };
}

export default async function SnacksSubsectionPage({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  const initialItems = await getItems();
  return <SnacksClient initialItems={initialItems} initialTab={tab} />;
}
