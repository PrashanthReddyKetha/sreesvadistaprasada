import FaqClient from './FaqClient';
import { faqData } from '@/data/mockData';

export const metadata = {
  title: 'FAQs — Ordering, Delivery & Dabba Wala',
  description: 'Answers about ordering, delivery to Milton Keynes (Wolverton, Stony Stratford, Greenleys), Edinburgh (Leith, Newington) and Glasgow (Pollokshields, Shawlands). Dabba Wala subscriptions, allergens, catering.',
};

const BASE_URL = 'https://www.sreesvadistaprasada.com';

const extraQAs = [
  {
    q: 'Which areas of Milton Keynes do you deliver to?',
    a: 'We deliver across Milton Keynes including Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley, Westcroft, Central MK, Emerson Valley, Shenley Brook End, Walnut Tree, Monkston, Brinklow, Furzton and surrounding MK postcodes (MK1–MK19). Not sure? WhatsApp us your postcode.',
  },
  {
    q: 'Which areas of Edinburgh do you deliver to?',
    a: 'We deliver across Edinburgh including Leith, Marchmont, Newington, Bruntsfield, Tollcross, Morningside, Southside Edinburgh, Haymarket, Old Town, New Town, Portobello, Gorgie, Dalry and surrounding EH postcodes (EH1–EH17).',
  },
  {
    q: 'Which areas of Glasgow do you deliver to?',
    a: 'We deliver across Glasgow including Pollokshields, Shawlands, Govanhill, Southside Glasgow, Finnieston, West End, Partick, Merchant City, Dennistoun, Maryhill, Byres Road area and surrounding G postcodes (G1–G46).',
  },
  {
    q: 'Is your meat halal?',
    a: 'Yes. All meat used in our Svadista non-vegetarian menu is sourced from halal-certified suppliers. Our Prasada kitchen is fully vegetarian with no cross-contamination.',
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
      <FaqClient />
    </>
  );
}
