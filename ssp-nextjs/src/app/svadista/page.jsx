import SvadistaClient from './SvadistaClient';

export const revalidate = 3600;

export const metadata = {
  title: { absolute: 'Andhra Curries & Biryani Milton Keynes | Sree Svadista Prasada' },
  description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
  keywords: ['non veg Indian food Milton Keynes', 'chicken biryani Milton Keynes', 'South Indian meat curries MK', 'mutton curry delivery Milton Keynes', 'best biryani Milton Keynes', 'Andhra chicken curry delivery', 'authentic non veg South Indian food'],
  openGraph: {
    title: 'Andhra Curries & Biryani Milton Keynes | Sree Svadista Prasada',
    description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/svadista',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80', width: 1200, height: 630, alt: 'Andhra Curries & Biryani Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andhra Curries & Biryani Milton Keynes | Sree Svadista Prasada',
    description: 'Non-veg Indian food Milton Keynes — slow-cooked Andhra curries, village-style chicken, mutton biryani & more. Bold South Indian flavours. Order now.',
    images: ['https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/svadista' },
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
      <h1 className="sr-only">Non-Veg Indian Food Milton Keynes — Andhra Curries, Biryani & More</h1>
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
