import SubscriptionsClient from './SubscriptionsClient';

export const metadata = {
  title: 'Indian Tiffin Service Milton Keynes | Daily Meal Subscriptions | Dabba Wala',
  description: 'Indian tiffin service Milton Keynes — freshly cooked daily South Indian meals from £45/week. Veg & non-veg Andhra boxes delivered Mon–Fri. Subscribe now.',
  keywords: ['Indian tiffin service Milton Keynes', 'tiffin delivery Milton Keynes', 'Dabba Wala MK', 'South Indian meal subscription UK', 'weekly Indian food delivery Milton Keynes', 'meal prep delivery MK', 'healthy Indian lunch delivery'],
  openGraph: {
    title: 'Indian Tiffin Service Milton Keynes | Dabba Wala Subscriptions',
    description: 'Indian tiffin service Milton Keynes — freshly cooked daily South Indian meals from £45/week. Veg & non-veg Andhra boxes delivered Mon–Fri. Subscribe now.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Tiffin Service Milton Keynes | Dabba Wala Subscriptions',
    description: 'Indian tiffin service Milton Keynes — freshly cooked daily South Indian meals from £45/week. Veg & non-veg Andhra boxes delivered Mon–Fri. Subscribe now.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Dabba Wala — Weekly South Indian Meal Subscription',
  description: 'Weekly home-cooked South Indian meal plan delivered to your door in Milton Keynes, Edinburgh and Glasgow. Fresh Andhra and Telugu cooking — rice, dal, curry, pickle and papad every day.',
  brand: { '@type': 'Brand', name: 'Sree Svadista Prasada' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'GBP',
    price: '7.00',
    priceValidUntil: '2027-12-31',
    availability: 'https://schema.org/InStock',
    url: 'https://www.sreesvadistaprasada.com/subscriptions',
  },
  areaServed: [
    { '@type': 'City', name: 'Milton Keynes' },
    { '@type': 'City', name: 'Edinburgh' },
    { '@type': 'City', name: 'Glasgow' },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Server-rendered content — always visible to Google */}
      <section className="sr-only">
        <h1>Dabba Wala — Weekly South Indian Meal Subscription, Milton Keynes</h1>
        <p>
          Milton Keynes&apos; only weekly home-cooked South Indian meal subscription.
          Fresh Andhra and Telugu dishes delivered to your door every week across
          Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley,
          Westcroft, Emerson Valley and all MK postcodes (MK1–MK19).
          Also delivering across Edinburgh — Leith, Marchmont, Newington, Bruntsfield,
          Tollcross, Morningside, Southside Edinburgh (EH1–EH17) — and Glasgow —
          Pollokshields, Shawlands, Govanhill, Southside Glasgow, Finnieston,
          West End, Partick (G1–G46).
        </p>
        <h2>Subscription Plans</h2>
        <ul>
          <li>Prasada Weekly — Pure vegetarian South Indian meals, 5 days/week</li>
          <li>Svadista Weekly — Halal non-vegetarian South Indian meals, 5 days/week</li>
          <li>Mixed Weekly — Combination of Prasada and Svadista</li>
          <li>Monthly Plan — Full month of daily dabbas at a discounted rate</li>
        </ul>
        <h2>What&apos;s in your Dabba</h2>
        <p>
          Each dabba includes rice, dal, sabzi, curry, pickle and papad —
          a complete home-style South Indian meal, packed fresh and delivered hot.
          No MSG. No preservatives. Traditional Andhra and Telugu recipes, every day.
        </p>
        <h2>How it works</h2>
        <ol>
          <li>Choose your plan — Prasada (veg), Svadista (non-veg) or Mixed</li>
          <li>Select your delivery days and times</li>
          <li>We cook fresh and deliver to your door</li>
          <li>Pause or cancel anytime — no lock-in, no penalties</li>
        </ol>
        <h2>Delivery areas</h2>
        <p>
          Milton Keynes: Wolverton, Stony Stratford, Greenleys, Newport Pagnell,
          Bletchley, Westcroft, Central MK, Emerson Valley, Shenley Brook End (MK1–MK19).
          Edinburgh: Leith, Marchmont, Newington, Bruntsfield, Tollcross, Morningside (EH1–EH17).
          Glasgow: Pollokshields, Shawlands, Govanhill, Southside, Finnieston, West End (G1–G46).
          Pickles, podis and snacks ship UK-wide.
        </p>
      </section>
      <SubscriptionsClient />
    </>
  );
}
