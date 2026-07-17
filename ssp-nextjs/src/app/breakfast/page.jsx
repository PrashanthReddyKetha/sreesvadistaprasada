import BreakfastClient from './BreakfastClient';

export const revalidate = 3600;

export const metadata = {
  title: 'South Indian Breakfast Milton Keynes | Dosa, Idli & Vada Delivery',
  description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
  keywords: ['South Indian breakfast Milton Keynes', 'dosa Milton Keynes', 'masala dosa near me', 'idli sambar delivery near me', 'sambar vada takeaway', 'South Indian breakfast buffet MK', 'crispy dosa takeaway Milton Keynes'],
  openGraph: {
    title: 'South Indian Breakfast Milton Keynes | Dosa, Idli & Vada Delivery',
    description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'South Indian Breakfast Milton Keynes | Dosa, Idli & Vada Delivery',
    description: 'South Indian breakfast Milton Keynes — crispy masala dosa, idli sambar & freshly fried vada delivered hot. Light, fresh and authentic. Order now.',
  },
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
  return <BreakfastClient initialItems={initialItems} initialTab="Idli & Vada" />;
}
