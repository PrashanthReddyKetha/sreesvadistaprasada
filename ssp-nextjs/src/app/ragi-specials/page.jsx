import RagiClient from './RagiClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Ragi Specials — Healthy Finger Millet Dishes',
  description: 'Nutritious ragi (finger millet) dishes: ragi mudde, ragi dosa, ragi idli and more. Wholesome South Indian health food delivered in Milton Keynes, Edinburgh & Glasgow.',
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=ragiSpecials&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function RagiPage() {
  const initialItems = await getItems();
  return <RagiClient initialItems={initialItems} />;
}
