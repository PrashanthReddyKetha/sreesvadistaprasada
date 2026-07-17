import PrasadaClient from './PrasadaClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Vegetarian Indian Restaurant Milton Keynes | Pure Veg Food | Sree Prasada',
  description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
  keywords: ['vegetarian Indian restaurant Milton Keynes', 'pure veg restaurant Milton Keynes', 'vegan Indian food Milton Keynes', 'Indian vegetarian catering MK', 'veg thali delivery MK', 'no onion no garlic Indian food near me', 'Jain food delivery Milton Keynes'],
  openGraph: {
    title: 'Vegetarian Indian Restaurant Milton Keynes | Pure Veg Food',
    description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vegetarian Indian Restaurant Milton Keynes | Pure Veg Food',
    description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
  },
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
