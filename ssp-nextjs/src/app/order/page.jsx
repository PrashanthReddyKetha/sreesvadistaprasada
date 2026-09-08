import { Suspense } from 'react';
import OrderClient from './OrderClient';

// ISR: bake the menu into the page so the list paints instantly with zero
// layout shift; refreshed in the background every 5 minutes
export const revalidate = 300;

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getMenu() {
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export const metadata = {
  title: 'Order Now | Sree Svadista Prasada',
  description:
    'Order authentic Andhra food for collection or delivery in Milton Keynes. Pick your collection time, pay securely, and collect fresh from our kitchen.',
  alternates: { canonical: 'https://sreesvadistaprasada.com/order' },
};

export default async function OrderPage() {
  const initialItems = await getMenu();
  return <Suspense fallback={null}><OrderClient initialItems={initialItems} /></Suspense>;
}
