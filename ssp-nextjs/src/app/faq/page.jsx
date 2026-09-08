import FaqClient from './FaqClient';
import { faqData } from '@/data/mockData';

export const metadata = {
  title: { absolute: 'Indian Takeaway FAQs Milton Keynes | Sree Svadista Prasada' },
  description: 'Indian takeaway FAQs Milton Keynes — pure veg kitchen, tiffin delivery zones, allergens & more. All your questions answered.',
  keywords: ['Indian takeaway Milton Keynes postcodes', 'pure veg separate kitchens', 'how to pause tiffin subscription', 'best Indian food delivery app MK', 'South Indian restaurant opening hours', 'Indian meal delivery FAQ'],
  openGraph: {
    title: 'Indian Takeaway FAQs Milton Keynes | Sree Svadista Prasada',
    description: 'Indian takeaway FAQs Milton Keynes — pure veg kitchen, tiffin delivery zones, allergens & more. All your questions answered.',
    type: 'website',
    url: 'https://sreesvadistaprasada.com/faq',
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80', width: 1200, height: 630, alt: 'Sree Svadista Prasada — Indian Takeaway Milton Keynes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Takeaway FAQs Milton Keynes | Sree Svadista Prasada',
    description: 'Indian takeaway FAQs Milton Keynes — pure veg kitchen, tiffin delivery zones, allergens & more. All your questions answered.',
    images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80'],
  },
  alternates: { canonical: 'https://sreesvadistaprasada.com/faq' },
};

const BASE_URL = 'https://sreesvadistaprasada.com';

const extraQAs = [
  {
    q: 'Which areas of Milton Keynes do you deliver to?',
    a: 'We deliver across Milton Keynes including Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley, Westcroft, Central MK, Emerson Valley, Shenley Brook End, Walnut Tree, Monkston, Brinklow, Furzton and surrounding MK postcodes (MK1–MK19). Not sure? WhatsApp us your postcode.',
  },
  {
    q: 'Do you deliver to Edinburgh?',
    a: 'Not yet — we currently deliver across Milton Keynes only. Edinburgh is coming soon; join the waitlist and we\'ll let you know the moment we launch there.',
  },
  {
    q: 'Do you deliver to Glasgow?',
    a: 'Not yet — we currently deliver across Milton Keynes only. Glasgow is coming soon; join the waitlist and we\'ll let you know the moment we launch there.',
  },
];

export default function Page() {
  const allQAs = [...faqData.flatMap(cat => cat.items), ...extraQAs];

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
      <h1 className="sr-only">Indian Takeaway FAQs Milton Keynes — Delivery, Tiffin & Dietary Questions</h1>
      <FaqClient />
    </>
  );
}
