import { notFound } from 'next/navigation';
import Link from 'next/link';
import SnacksClient from '../SnacksClient';

export const revalidate = 3600;

const SLUG_TO_TAB = {
  'pickles': 'Pickles',
  'podis':   'Podis',
};

// Only products that exist in the menu are named
const COPY = {
  pickles: {
    heading: 'Andhra pickles — nearly here',
    text: 'Our Andhra pickles are made in small batches: mango avakaya, gongura pickle, lemon pickle, tomato pickle, allam pachadi and velluli pachadi. These are Telugu pickles the way they are made at home, and we plan to offer them as Indian pickles online across the UK once they are ready. Tap Notify Me and we will tell you when they launch.',
  },
  podis: {
    heading: 'Andhra podis — nearly here',
    text: 'Our Andhra podis are dry-roasted and ground in small batches: kandi podi, nalla karam, karivepaku podi, kobbari podi, nuvvula podi and palli podi. They are the South Indian spice powders you eat with hot rice and ghee, or with idli and dosa. Tap Notify Me and we will tell you when they launch.',
  },
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
  return (
    <>
      <SnacksClient seoLine={`Andhra ${tab.toLowerCase()} — coming soon`} />
      <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-3xl mx-auto text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
          <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            {COPY[params.subsection].heading}
          </h2>
          <p className="mb-3">{COPY[params.subsection].text}</p>
          <p>
            See the whole <Link href="/snacks" className="underline font-semibold" style={{ color: '#800020' }}>pickles &amp; podis range</Link>,
            or order from the <Link href="/menu" className="underline font-semibold" style={{ color: '#800020' }}>cooked menu</Link> in Milton Keynes today.
          </p>
        </div>
      </section>
    </>
  );
}
