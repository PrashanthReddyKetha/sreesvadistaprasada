import Link from 'next/link';
import DrinksClient from './DrinksClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Mango Lassi & Indian Drinks Milton Keynes | Sree Svadista Prasada' },
  description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
  keywords: ['mango lassi Milton Keynes', 'Indian drinks Milton Keynes', 'lassi delivery near me', 'masala buttermilk delivery MK', 'fresh juice delivery Milton Keynes', 'Indian beverages online UK'],
  openGraph: {
    title: 'Mango Lassi & Indian Drinks Milton Keynes | Sree Svadista Prasada',
    description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/drinks',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1666251214695-405f673b396a?w=1200&q=80', width: 1200, height: 630, alt: 'Mango Lassi & Indian Drinks Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mango Lassi & Indian Drinks Milton Keynes | Sree Svadista Prasada',
    description: 'Mango Lassi Milton Keynes — ripe Alphonso mango blended with creamy yoghurt. Plus masala buttermilk, fresh juices & traditional Indian drinks. Order now.',
    images: ['https://images.unsplash.com/photo-1666251214695-405f673b396a?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/drinks' },
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=drinks&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function DrinksPage() {
  const initialItems = await getItems();
  return (
    <>
      <DrinksClient initialItems={initialItems} />
      <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-3xl mx-auto text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
          <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Traditional Indian drinks, made in Milton Keynes
          </h2>
          <p className="mb-3">
            The drinks on this page come from the same kitchen as everything else we cook — fresh
            lassis and traditional South Indian beverages made to order, not poured from a carton.
            They ride along with any food order across Milton Keynes.
          </p>
          <p>
            Pair them with a <Link href="/breakfast/dosas" className="underline font-semibold" style={{ color: '#800020' }}>crispy dosa</Link>,
            a fiery plate from the <Link href="/svadista" className="underline font-semibold" style={{ color: '#800020' }}>Svadista menu</Link>,
            or order on their own with <Link href="/delivery" className="underline font-semibold" style={{ color: '#800020' }}>delivery across all MK postcodes</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
