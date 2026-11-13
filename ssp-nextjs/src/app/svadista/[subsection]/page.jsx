import SeoSection from '@/components/SeoSection';
import { categorySeo } from '@/lib/categorySeo';
import { canonicalOf, slugToTab } from '@/lib/menuSections';
import { notFound } from 'next/navigation';
import SvadistaClient from '../SvadistaClient';

export const revalidate = 3600;

const SLUG_TO_TAB = slugToTab('svadista');   // src/lib/menuSections.js

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?category=nonVeg&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_TAB).map(subsection => ({ subsection }));
}

export async function generateMetadata(props) {
  const params = await props.params;
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) return {};
  const seo = categorySeo('svadista', params.subsection);
  return {
    title: seo?.title || `${tab} — Svadista Non-Veg Menu`,
    description: seo?.description || `Order authentic South Indian ${tab.toLowerCase()}. Non-vegetarian specialities freshly cooked in Milton Keynes.`,
    keywords: seo?.keywords,
    alternates: { canonical: canonicalOf('svadista', params.subsection) },
  };
}

export default async function SvadistaSubsectionPage(props) {
  const params = await props.params;
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  const initialItems = await getItems();
  const seo = categorySeo('svadista', params.subsection);
  return (
    <>
      <SvadistaClient initialItems={initialItems} initialTab={tab} seoHeading={seo?.h1 || tab} />
      {seo?.body && <SeoSection paragraphs={[seo.body]} links={[['Full Svadista non-veg menu', '/svadista'], ['Order online', '/order']]} />}
    </>
  );
}
