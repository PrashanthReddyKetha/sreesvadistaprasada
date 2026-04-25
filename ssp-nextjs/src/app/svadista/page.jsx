import SvadistaClient from './SvadistaClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Svadista — Halal Non-Veg South Indian Food, Milton Keynes',
  description: 'Halal-certified non-veg South Indian food in Milton Keynes, Edinburgh & Glasgow. Gongura Chicken, Natu Kodi Biryani, Mutton Curry — bold Andhra flavours. Delivering to Wolverton, Stony Stratford, Leith, Pollokshields and surrounding areas.',
};

async function getItems() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';
  try {
    const res = await fetch(`${BASE}/api/menu?category=nonVeg&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function SvadistaPage() {
  const initialItems = await getItems();
  return (
    <>
      <p className="sr-only">
        All our meat is sourced from halal-certified suppliers. Bold, rustic Andhra
        and Telugu non-vegetarian cooking — Gongura Chicken, Natu Kodi Biryani,
        Mutton Curry, Egg Specials and Indo-Chinese dishes. Delivered across Milton
        Keynes (Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley,
        Westcroft, Central MK), Edinburgh (Leith, Marchmont, Newington, Bruntsfield,
        Morningside, Southside Edinburgh) and Glasgow (Pollokshields, Shawlands,
        Govanhill, Finnieston, West End, Partick).
      </p>
      <SvadistaClient initialItems={initialItems} initialTab="Starters" />
    </>
  );
}
