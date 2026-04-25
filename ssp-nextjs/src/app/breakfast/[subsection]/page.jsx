import { notFound } from 'next/navigation';
import BreakfastClient from '../BreakfastClient';

export const revalidate = 3600;

const SLUG_TO_TAB = {
  'idli-vada':    'Idli & Vada',
  'dosas':        'Dosas',
  'poori-others': 'Poori & Others',
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?category=breakfast&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_TAB).map(subsection => ({ subsection }));
}

export async function generateMetadata({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) return {};
  return {
    title: `${tab} — Breakfast Menu | Sree Svadista Prasada`,
    description: `Authentic South Indian ${tab.toLowerCase()} made fresh every morning. Order online for delivery in Milton Keynes, Edinburgh & Glasgow.`,
  };
}

export default async function BreakfastSubsectionPage({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  const initialItems = await getItems();
  return <BreakfastClient initialItems={initialItems} initialTab={tab} />;
}
