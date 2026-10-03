import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import Link from 'next/link';
import SnacksClient from './SnacksClient';

export const revalidate = 3600;

export const metadata = pageMeta('/snacks', { image: 'https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?w=1200&q=80' });

export default function SnacksPage() {
  return (
    <>
      <SnacksClient seoLine={PAGE_SEO['/snacks'].h1} />
      <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-3xl mx-auto text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
          <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
            Handmade Andhra pickles & podis — nearly here
          </h2>
          <p className="mb-3">
            Avakaya cut in the traditional way, podis stone-ground in small batches — the jars every
            Andhra household guards are being prepared for launch. They will ship UK-wide when they land.
          </p>
          <p>
            Until then, the <Link href="/menu" className="underline font-semibold" style={{ color: '#800020' }}>full cooked menu</Link> is
            live in Milton Keynes — and <Link href="/subscriptions" className="underline font-semibold" style={{ color: '#800020' }}>Dabba Wala subscriptions</Link> are open now.
          </p>
        </div>
      </section>
    </>
  );
}
