import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import FaqClient from './FaqClient';
import { faqData } from '@/data/mockData';
import { jsonLd as safeJsonLd } from '@/lib/seo/jsonLd';

export const metadata = pageMeta('/faq', { image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80' });

const BASE_URL = 'https://sreesvadistaprasada.com';

const extraQAs = [
  {
    q: 'Which areas of Milton Keynes do you deliver to?',
    a: 'We deliver across Milton Keynes including Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley, Westcroft, Central MK, Emerson Valley, Shenley Brook End, Walnut Tree, Monkston, Brinklow, Furzton and surrounding MK postcodes (MK1–MK19). Not sure? WhatsApp us your postcode.',
  },
  {
    q: 'Do you deliver to Edinburgh?',
    a: 'Not yet — we currently deliver across Milton Keynes only. Edinburgh is coming soon; register your interest on our Edinburgh page and we\'ll let you know the moment we launch there.',
  },
  {
    q: 'Do you deliver to Glasgow?',
    a: 'Not yet — we currently deliver across Milton Keynes only. Glasgow is coming soon; register your interest on our Glasgow page and we\'ll let you know the moment we launch there.',
  },
];

export default function Page() {
  // The schema lists exactly what the page shows (A-0003, SEO-002): the extra questions are rendered too
  const visibleFaq = [...faqData, { category: 'Where we deliver', items: extraQAs }];
  const allQAs = visibleFaq.flatMap(cat => cat.items);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allQAs.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <FaqClient seoLine={PAGE_SEO['/faq'].h1} data={visibleFaq} />
    </>
  );
}
