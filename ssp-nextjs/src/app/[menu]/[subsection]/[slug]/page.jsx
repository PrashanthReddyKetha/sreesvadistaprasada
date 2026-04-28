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

export async function generateMetadata({ params }) {
  const item = await getItem(params.slug);
  if (!item) return { title: 'Dish Not Found — Sree Svadista Prasada' };
  return {
    title: `${item.name} — Sree Svadista Prasada`,
    description: item.description?.slice(0, 160),
    openGraph: {
      title: item.name,
      description: item.description?.slice(0, 160),
      images: item.image ? [{ url: item.image }] : [],
    },
  };
}

export default async function ItemPage({ params }) {
  const item = await getItem(params.slug);
  if (!item) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
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
  };

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
