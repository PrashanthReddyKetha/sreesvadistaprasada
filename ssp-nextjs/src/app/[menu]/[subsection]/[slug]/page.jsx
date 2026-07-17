import { notFound } from 'next/navigation';
import ItemDetailClient from './ItemDetailClient';

export const revalidate = 60;

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItem(slug) {
  try {
    const res = await fetch(`${BASE}/api/menu/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const SITE = 'https://sreesvadistaprasada.com';

const CATEGORY_LABELS = {
  nonVeg: 'Non-Veg Indian Food', veg: 'Vegetarian Indian Food',
  prasada: 'Pure Veg South Indian', breakfast: 'South Indian Breakfast',
  snacks: 'Indian Snacks', pickles: 'Andhra Pickles', podis: 'Andhra Podis',
  drinks: 'Indian Drinks',
};

export async function generateMetadata({ params }) {
  const item = await getItem(params.slug);
  if (!item) return { title: { absolute: 'Dish Not Found | Sree Svadista Prasada' } };

  const catLabel = CATEGORY_LABELS[item.category] || 'South Indian Food';
  const desc = item.seo_meta_description
    || `${item.name} — ${(item.description || '').slice(0, 130).trim()}. Order online in Milton Keynes from Sree Svadista Prasada.`;
  const itemUrl = `${SITE}/${params.menu}/${params.subsection}/${params.slug}`;
  const images = item.image ? [{ url: item.image, width: 800, height: 600, alt: item.name }] : [];

  return {
    title: { absolute: `${item.name} | Indian Takeaway Milton Keynes | Sree Svadista Prasada` },
    description: desc,
    keywords: [
      item.name,
      `${item.name} Milton Keynes`,
      `${item.name} delivery`,
      `${item.name} near me`,
      `${catLabel} Milton Keynes`,
      'South Indian food Milton Keynes',
      'Indian takeaway Milton Keynes',
    ].join(', '),
    openGraph: {
      title: `${item.name} | ${catLabel} Milton Keynes | Sree Svadista Prasada`,
      description: desc,
      url: itemUrl,
      siteName: 'Sree Svadista Prasada',
      type: 'website',
      locale: 'en_GB',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.name} | Indian Takeaway Milton Keynes | Sree Svadista Prasada`,
      description: desc,
      images: item.image ? [item.image] : [],
    },
    alternates: { canonical: itemUrl },
  };
}

export default async function ItemPage({ params }) {
  const item = await getItem(params.slug);
  if (!item) notFound();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'MenuItem',
      name: item.name,
      description: item.description,
      image: item.image || undefined,
      url: `${SITE}/${params.menu}/${params.subsection}/${params.slug}`,
      offers: {
        '@type': 'Offer',
        price: item.price,
        priceCurrency: 'GBP',
        availability: item.available
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
      suitableForDiet: item.is_veg
        ? 'https://schema.org/VegetarianDiet'
        : undefined,
      inMenu: {
        '@type': 'Menu',
        name: 'Sree Svadista Prasada Menu',
        url: `${SITE}/menu`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: params.menu.charAt(0).toUpperCase() + params.menu.slice(1), item: `${SITE}/${params.menu}` },
        { '@type': 'ListItem', position: 3, name: item.name, item: `${SITE}/${params.menu}/${params.subsection}/${params.slug}` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ItemDetailClient initialItem={item} />
    </>
  );
}
