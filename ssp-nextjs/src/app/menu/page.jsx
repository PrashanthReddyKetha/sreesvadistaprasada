import Link from 'next/link';
import MenuClient from './MenuClient';

export const revalidate = 3600;

export const metadata = {
  title: 'Full South Indian Menu — 170+ Dishes',
  description: 'Browse 170+ authentic South Indian dishes: Gongura Chicken, Natu Kodi Biryani, dosas, Pulihora, Ragi Specials, handmade pickles and podis. Order online for delivery in Milton Keynes (Wolverton, Stony Stratford), Edinburgh (Leith, Newington) and Glasgow (Pollokshields, Shawlands).',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: 'Full Menu — Sree Svadista Prasada',
  url: 'https://www.sreesvadistaprasada.com/menu',
  hasMenuSection: [
    { '@type': 'MenuSection', name: 'Prasada', description: 'Pure vegetarian South Indian dishes', url: 'https://www.sreesvadistaprasada.com/prasada' },
    { '@type': 'MenuSection', name: 'Svadista', description: 'Halal non-vegetarian South Indian dishes', url: 'https://www.sreesvadistaprasada.com/svadista' },
    { '@type': 'MenuSection', name: 'Breakfast', description: 'South Indian breakfast — idli, vada, dosas, poori', url: 'https://www.sreesvadistaprasada.com/breakfast' },
    { '@type': 'MenuSection', name: 'Street Food', description: 'South Indian street food and chaat', url: 'https://www.sreesvadistaprasada.com/street-food' },
    { '@type': 'MenuSection', name: 'Ragi Specials', description: 'Ragi-based health foods unique to our menu', url: 'https://www.sreesvadistaprasada.com/ragi-specials' },
    { '@type': 'MenuSection', name: 'Hot, Sweet & Pickles', description: 'Handmade pickles, podis and snacks — ships UK-wide', url: 'https://www.sreesvadistaprasada.com/snacks' },
    { '@type': 'MenuSection', name: 'Drinks', description: 'South Indian drinks and beverages', url: 'https://www.sreesvadistaprasada.com/drinks' },
  ],
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function FullMenuPage() {
  const initialItems = await getItems();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Server-rendered intro — always visible to Google */}
      <section className="sr-only">
        <h1>Our Full Menu — 170+ South Indian Dishes</h1>
        <p>
          From slow-cooked Gongura Chicken and Natu Kodi Biryani to temple-style
          Pulihora and crispy dosas — every dish made fresh to order. Browse by
          category or order online for delivery in Milton Keynes (Wolverton, Stony
          Stratford, Greenleys, Newport Pagnell, Bletchley, Westcroft, Central MK),
          Edinburgh (Leith, Marchmont, Newington, Bruntsfield, Morningside, Tollcross)
          and Glasgow (Pollokshields, Shawlands, Govanhill, Finnieston, West End, Partick).
        </p>
        <nav aria-label="Menu categories">
          <Link href="/prasada">Prasada — Pure Vegetarian</Link>{' · '}
          <Link href="/svadista">Svadista — Halal Non-Vegetarian</Link>{' · '}
          <Link href="/breakfast">Breakfast &amp; Tiffins</Link>{' · '}
          <Link href="/street-food">Street Food</Link>{' · '}
          <Link href="/ragi-specials">Ragi Specials</Link>{' · '}
          <Link href="/snacks">Hot, Sweet &amp; Pickles</Link>{' · '}
          <Link href="/drinks">Drinks</Link>
        </nav>
      </section>
      <MenuClient initialItems={initialItems} />
    </>
  );
}
