import FaqClient from './FaqClient';
import { faqData } from '@/data/mockData';

export const metadata = {
  title: 'FAQ — Ordering, Delivery & Subscriptions | Sree Svadista Prasada',
  description: 'Answers about ordering, delivery, Dabba Wala subscriptions, allergens, catering, and payments at Sree Svadista Prasada — South Indian food in Milton Keynes, Edinburgh & Glasgow.',
};

const BASE_URL = 'https://www.sreesvadistaprasada.com';

export default function Page() {
  const allQAs = faqData.flatMap(cat => cat.items);

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaqClient />
    </>
  );
}
