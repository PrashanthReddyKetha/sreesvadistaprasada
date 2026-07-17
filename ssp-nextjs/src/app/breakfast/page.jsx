import BreakfastClient from './BreakfastClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'South Indian Breakfast Milton Keynes | Sree Svadista Prasada' },
  description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
  keywords: ['South Indian breakfast Milton Keynes', 'dosa Milton Keynes', 'masala dosa near me', 'idli sambar delivery near me', 'sambar vada takeaway', 'South Indian breakfast buffet MK', 'crispy dosa takeaway Milton Keynes'],
  openGraph: {
    title: 'South Indian Breakfast Milton Keynes | Dosa, Idli & Vada | Sree Svadista Prasada',
    description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/breakfast',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80', width: 1200, height: 630, alt: 'South Indian Breakfast — Dosa, Idli & Vada' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'South Indian Breakfast Milton Keynes | Sree Svadista Prasada',
    description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
    images: ['https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/breakfast' },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=breakfast&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function BreakfastPage() {
  const initialItems = await getItems();
  return (
    <>
      <h1 className="sr-only">South Indian Breakfast Milton Keynes — Dosa, Idli, Vada & More</h1>
      <BreakfastClient initialItems={initialItems} initialTab="Idli & Vada" />
    </>
  );
}
