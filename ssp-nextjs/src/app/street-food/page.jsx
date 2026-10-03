import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import Link from 'next/link';
import StreetFoodClient from './StreetFoodClient';

export const revalidate = 3600;

export const metadata = pageMeta('/street-food', { image: 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=1200&q=80' });

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=streetFood&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function StreetFoodPage() {
  const initialItems = await getItems();
  return (
    <>
      <StreetFoodClient initialItems={initialItems} />
      <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-3xl mx-auto text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
          <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Indian street food & evening delights in Milton Keynes
          </h2>
          <p className="mb-3">
            Evening in an Indian town has its own menu — hot, quick, unapologetically savoury.
            This page is our version of that hour: Indian street food in Milton Keynes, cooked
            fresh in Greenleys, not reheated under a lamp. Looking for pani puri or momos in
            Milton Keynes? They are here — pani puri, chicken momos and veg momos — beside Indian
            chaat such as channa chat and peanut chat, crisp bhajji and punugulu, wraps and burgers.
          </p>
          <p>
            Order them alongside the <Link href="/menu" className="underline font-semibold" style={{ color: '#800020' }}>full menu</Link> for
            <Link href="/delivery" className="underline font-semibold" style={{ color: '#800020' }}> delivery across Milton Keynes</Link>,
            or collect from the kitchen and save 10%.
          </p>
        </div>
      </section>
    </>
  );
}
