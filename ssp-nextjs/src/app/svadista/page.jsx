import SvadistaClient from './SvadistaClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Non-Veg Indian Food Milton Keynes | Andhra Curries & Biryani | Sree Svadista',
  description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
  keywords: ['non veg Indian food Milton Keynes', 'chicken biryani Milton Keynes', 'South Indian meat curries MK', 'mutton curry delivery Milton Keynes', 'best biryani Milton Keynes', 'Andhra chicken curry delivery', 'authentic non veg South Indian food'],
  openGraph: {
    title: 'Non-Veg Indian Food Milton Keynes | Andhra Curries & Biryani',
    description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Non-Veg Indian Food Milton Keynes | Andhra Curries & Biryani',
    description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
  },
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
