import SeoSection from '@/components/SeoSection';
import { categorySeo } from '@/lib/categorySeo';
import { canonicalOf, slugToTab } from '@/lib/menuSections';
import { notFound } from 'next/navigation';
import BreakfastClient from '../BreakfastClient';

export const revalidate = 3600;

const SLUG_TO_TAB = slugToTab('breakfast');   // src/lib/menuSections.js

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?category=breakfast&available=true`, { next: { revalidate: 3600 } });
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
  const seo = categorySeo('breakfast', params.subsection);
  return {
    title: seo?.title || `${tab} — Breakfast Menu`,
    description: seo?.description || `Authentic ${tab.toLowerCase()} made fresh every morning in Milton Keynes. Order online.`,
    keywords: seo?.keywords,
    alternates: { canonical: canonicalOf('breakfast', params.subsection) },
  };
}

export default async function BreakfastSubsectionPage(props) {
  const params = await props.params;
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  const initialItems = await getItems();
  const seo = categorySeo('breakfast', params.subsection);
  return (
    <>
      <BreakfastClient initialItems={initialItems} initialTab={tab} seoHeading={seo?.h1 || tab} />
      {seo?.body && <SeoSection paragraphs={[seo.body]} links={[['Full breakfast menu', '/breakfast'], ['Order online', '/order']]} />}
    </>
  );
}
