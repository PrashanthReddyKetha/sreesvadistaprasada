import { notFound } from 'next/navigation';
import SnacksClient from '../SnacksClient';

export const revalidate = 3600;

const SLUG_TO_TAB = {
  'pickles': 'Pickles',
  'podis':   'Podis',
};

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_TAB).map(subsection => ({ subsection }));
}

export async function generateMetadata({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) return {};
  return {
    title: `${tab} — Hot, Sweet & Pickles — Coming Soon | Sree Svadista Prasada`,
    description: `Authentic South Indian ${tab.toLowerCase()} — handmade with traditional recipes, coming soon to Milton Keynes, Edinburgh & Glasgow.`,
  };
}

export default async function SnacksSubsectionPage({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  return <SnacksClient />;
}
