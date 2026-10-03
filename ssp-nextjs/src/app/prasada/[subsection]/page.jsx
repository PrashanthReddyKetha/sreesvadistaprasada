import SeoSection from '@/components/SeoSection';
import { categorySeo } from '@/lib/categorySeo';
import { notFound, permanentRedirect } from 'next/navigation';
import PrasadaClient from '../PrasadaClient';

export const revalidate = 3600;

const SLUG_TO_TAB = {
  'bites-starters':    'Bites & Starters',
  'curries':           'Curries',
  'biriyanis-rice':    'Biriyanis & Rice',
  'thalis-rice-bowls': 'Thalis & Rice Bowls',
  'indo-chinese':      'Indo Chinese',
  'naivedyam':         '🪔 Naivedyam',
};

// Old URLs 308 to their current home instead of serving duplicate pages
const LEGACY_REDIRECTS = {
  'curries-daal': 'curries',
  'rice-bowls':   'thalis-rice-bowls',
};

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com';

async function getItems() {
  try {
    const res = await fetch(`${BASE}/api/menu?category=veg&available=true`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_TAB).map(subsection => ({ subsection }));
}

export async function generateMetadata({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) return {};
  const clean = tab.replace(/[^\w\s&-]/g, '').trim(); // no emoji in titles
  const seo = categorySeo('prasada', params.subsection);
  return {
    title: seo?.title || `${clean} — Prasada Vegetarian Menu`,
    description: seo?.description || `Order authentic South Indian vegetarian ${clean.toLowerCase()}. Pure veg, freshly cooked in Milton Keynes.`,
    keywords: seo?.keywords,
    alternates: { canonical: `https://sreesvadistaprasada.com/prasada/${params.subsection}` },
  };
}

export default async function PrasadaSubsectionPage({ params }) {
  const legacy = LEGACY_REDIRECTS[params.subsection];
  if (legacy) permanentRedirect(`/prasada/${legacy}`);
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  const initialItems = await getItems();
  const seo = categorySeo('prasada', params.subsection);
  return (
    <>
      <PrasadaClient initialItems={initialItems} initialTab={tab} seoHeading={seo?.h1} />
      {seo?.body && <SeoSection paragraphs={[seo.body]} links={[['Full Prasada vegetarian menu', '/prasada'], ['Order online', '/order']]} />}
    </>
  );
}
