import PrasadaClient from './PrasadaClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Pure Veg South Indian Food Milton Keynes | Sree Svadista Prasada' },
  description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
  keywords: ['vegetarian Indian restaurant Milton Keynes', 'pure veg restaurant Milton Keynes', 'vegan Indian food Milton Keynes', 'Indian vegetarian catering MK', 'veg thali delivery MK', 'no onion no garlic Indian food near me', 'Jain food delivery Milton Keynes'],
  openGraph: {
    title: 'Pure Veg South Indian Food Milton Keynes | Sree Svadista Prasada',
    description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/prasada',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?w=1200&q=80', width: 1200, height: 630, alt: 'Pure Veg South Indian Food Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pure Veg South Indian Food Milton Keynes | Sree Svadista Prasada',
    description: 'Vegetarian Indian restaurant Milton Keynes — 100% pure veg kitchen. Vegan, Jain & gluten-free options. Authentic Andhra temple-style cooking. Order now.',
    images: ['https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/prasada' },
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
  return (
    <>
      <h1 className="sr-only">Pure Veg South Indian Food Milton Keynes — Temple-Style Andhra Cooking</h1>
      <PrasadaClient initialItems={initialItems} initialTab="Bites & Starters" />
    </>
  );
}
