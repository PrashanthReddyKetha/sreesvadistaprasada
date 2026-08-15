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

const BREAKFAST_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What South Indian breakfast dishes do you serve?',
      acceptedAnswer: { '@type': 'Answer', text: 'We serve crispy Masala Dosa, Idli with fresh sambar, Medu Vada, Upma, Rava Kesari, Pongal, Filter Coffee, and our signature Karam Dosa. All freshly prepared to order.' },
    },
    {
      '@type': 'Question',
      name: 'When is South Indian breakfast available?',
      acceptedAnswer: { '@type': 'Answer', text: 'Breakfast is available every weekend from 8:00 AM and weekdays from 11:00 AM. All items are freshly prepared — no pre-made batters.' },
    },
    {
      '@type': 'Question',
      name: 'Is your South Indian breakfast menu vegetarian?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes, all breakfast dishes are vegetarian and most are vegan-friendly too. No meat or fish is used in our breakfast kitchen. Every item is clearly marked with dietary indicators on the menu.' },
    },
    {
      '@type': 'Question',
      name: 'Can I order South Indian breakfast for delivery in Milton Keynes?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes! We deliver hot South Indian breakfast across Milton Keynes. Dosas are packed with chutneys and sambar in insulated packaging to arrive as fresh as possible.' },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between Masala Dosa and Karam Dosa?',
      acceptedAnswer: { '@type': 'Answer', text: 'Masala Dosa is filled with a mild spiced potato filling (aloo masala) and served with sambar and coconut chutney. Karam Dosa is our chef special — spread with fiery Andhra karam (chilli-garlic paste) and served with extra chutneys. It is spicier and more intense.' },
    },
  ],
};

export default async function BreakfastPage() {
  const initialItems = await getItems();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREAKFAST_FAQ) }} />
      <h1 className="sr-only">South Indian Breakfast Milton Keynes — Dosa, Idli, Vada & More</h1>
      <BreakfastClient initialItems={initialItems} initialTab="Idli & Vada" />
    </>
  );
}
