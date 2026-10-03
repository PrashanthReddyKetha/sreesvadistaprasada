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
    title: `Andhra ${tab} UK — Coming Soon`,
    description: params.subsection === 'pickles'
      ? 'Handmade Andhra pickles — mango avakaya, gongura pickle, lemon pickle and more — coming soon to order online in the UK. Tap Notify Me or WhatsApp us.'
      : 'Handmade Andhra podis — kandi podi, nalla karam, karivepaku podi and more — coming soon to order online in the UK. Tap Notify Me or WhatsApp us.',
    keywords: params.subsection === 'pickles'
      ? ['Andhra pickles UK', 'Indian pickles online UK', 'mango avakaya', 'gongura pickle', 'Telugu pickles UK']
      : ['Andhra podi UK', 'kandi podi', 'nalla karam', 'karivepaku podi', 'South Indian spice powders'],
    alternates: { canonical: `https://sreesvadistaprasada.com/snacks/${params.subsection}` },
  };
}

export default async function SnacksSubsectionPage({ params }) {
  const tab = SLUG_TO_TAB[params.subsection];
  if (!tab) notFound();
  return <SnacksClient seoLine={`Andhra ${tab.toLowerCase()} — coming soon`} />;
}
