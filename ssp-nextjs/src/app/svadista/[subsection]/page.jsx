import { notFound } from 'next/navigation';
import SvadistaClient from '../SvadistaClient';

export const revalidate = 3600;

const SLUG_TO_TAB = {
  'starters':      'Starters',
  'indo-chinese':  'Indo - Chinese',
  'egg-specials':  'Egg Specials',
  'curries':       'Curries',
  'biriyani':      'Biriyani',
  'rice-bowls':    'Rice Bowls',
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?category=nonVeg&available=true`, { next: { revalidate: 3600 } });
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
    title: `${tab} — Svadista Non-Veg Menu | Sree Svadista Prasada`,
    description: `Order authentic South Indian ${tab.toLowerCase()} dishes. Non-vegetarian specialities freshly cooked in Milton Keynes, delivered to Edinburgh & Glasgow.`,
  };
}

export default async function SvadistaSubsectionPage({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  const initialItems = await getItems();
  return <SvadistaClient initialItems={initialItems} initialTab={tab} />;
}
