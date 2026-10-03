import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import RagiClient from './RagiClient';

export const revalidate = 3600;

export const metadata = pageMeta('/ragi-specials', { image: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=1200&q=80' });

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
  return (
    <>
      <RagiClient initialItems={initialItems} />
    </>
  );
}
