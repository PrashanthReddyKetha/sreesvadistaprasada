import { pageMeta, PAGE_SEO } from '@/lib/seo/pages';
import SubscriptionsClient from './SubscriptionsClient';
import { getDishPhotos } from '@/lib/siteStatus';

export const revalidate = 600;

export const metadata = pageMeta('/subscriptions', { image: 'https://images.unsplash.com/photo-1727404679933-99daa2a7573a?w=1200&q=80' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Dabba Wala — Weekly South Indian Meal Subscription',
  description: 'Weekly home-cooked South Indian meal plan delivered to your door in Milton Keynes. Fresh Andhra and Telugu cooking — rice, dal, curry, pickle and papad, Monday to Friday.',
  brand: { '@type': 'Brand', name: 'Sree Svadista Prasada' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'GBP',
    price: '75.00',
    priceValidUntil: '2027-12-31',
    availability: 'https://schema.org/InStock',
    url: 'https://sreesvadistaprasada.com/subscriptions',
  },
  areaServed: [
    { '@type': 'City', name: 'Milton Keynes' },
  ],
};

export default async function Page() {
  // The kitchen's own dish photos stand in for the stock pictures
  const photos = await getDishPhotos();
  const art = {
    hero: photos['tomato-rice']?.image,
    meal: photos['pappu-pappadam-roti-pachadi-rice-yogurt']?.image,
    why: photos['aloo-kurma']?.image,
    // Different dishes from the "dishes like these" row above them on the page
    whyPhotos: ['aloo-kurma', 'fish-pulusu-2', 'curd-rice', 'perugu-pulusu', 'potato-fry', 'rasam', 'egg-fry', 'coconut-rice']
      .filter(s => photos[s]).map(s => photos[s]),
    rotation: ['tomato-pappu', 'sambar', 'gongura-pappu', 'bhindi-pulusu', 'chicken-curry-2', 'mulakkada-tomato-curry']
      .filter(s => photos[s]).map(s => photos[s]),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SubscriptionsClient art={art} />
      {/* Server-rendered content — visible twin of what used to be sr-only */}
      <section className="py-12 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-3xl mx-auto space-y-8 text-sm leading-relaxed" style={{ color: '#5C4B47' }}>
          <div>
            <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Dabba Wala — Indian tiffin service in Milton Keynes
            </h1>
            <p>
              An Indian tiffin service near you in Milton Keynes: fresh Andhra and Telugu dishes
              delivered to your door, Monday to Friday, across
              Wolverton, Stony Stratford, Greenleys, Newport Pagnell, Bletchley,
              Westcroft, Emerson Valley and all MK postcodes (MK1–MK19).
              Edinburgh and Glasgow subscriptions are coming soon — join the waitlist.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>What&apos;s in your dabba</h2>
            <p>
              Rice, dal, sabzi, curry, pickle and papad — a complete home-style South
              Indian meal, packed fresh and delivered hot. No MSG. No preservatives.
              Traditional Andhra and Telugu recipes, every day. Choose Prasada (pure veg)
              or Svadista (non-veg), weekly — or save with the monthly plan.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>Tiffin service prices</h2>
            <p>
              Weekly tiffin: £75 for five meals, Monday to Friday. Monthly tiffin: £275 for twenty meals.
              Delivery is charged per meal from £1.74, depending on your Milton Keynes postcode, and is free
              on your first 2 meals (weekly) or first 5 meals (monthly) as a new customer. One payment, no auto-renewal.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>Vegetarian or non-veg Indian tiffin</h2>
            <p>
              Choose the Prasada box for an Indian vegetarian tiffin service, or the Svadista box for non-veg. Either way
              it is a home-made tiffin service — rice, dal, curry and sides cooked that morning — delivered as a tiffin box
              between 12 and 2pm, so it works as Indian lunch delivery in Milton Keynes, at home or at the office.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>How it works</h2>
            <p>
              Our dabba service in Milton Keynes is simple: choose your plan and start week, and we cook
              fresh and deliver Monday to Friday to your door. No auto-renewal — and if your plans change, just get in touch. We&apos;re flexible.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
