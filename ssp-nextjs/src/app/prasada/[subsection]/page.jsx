import { notFound } from 'next/navigation';
import PrasadaClient from '../PrasadaClient';

export const revalidate = 3600;

const SLUG_TO_TAB = {
  'bites-starters':  'Bites & Starters',
  'curries-daal':    'Curries & Daal',
  'biriyanis-rice':  'Biriyanis & Rice',
  'rice-bowls':      'Rice Bowls',
  'indo-chinese':    'Indo Chinese',
  'naivedyam':       '🪔 Naivedyam',
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?category=veg&available=true`, { next: { revalidate: 3600 } });
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
    title: `${tab} — Prasada Vegetarian Menu | Sree Svadista Prasada`,
    description: `Order authentic South Indian vegetarian ${tab.toLowerCase()} dishes. Pure veg, freshly cooked in Milton Keynes, delivered to Edinburgh & Glasgow.`,
  };
}

export default async function PrasadaSubsectionPage({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  const initialItems = await getItems();
  return <PrasadaClient initialItems={initialItems} initialTab={tab} />;
}
