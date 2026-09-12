import Link from 'next/link';
import FaqSection, { faqSchema } from '@/components/FaqSection';

const BASE_URL = 'https://sreesvadistaprasada.com';

export const metadata = {
  title: { absolute: 'Indian Food Delivery Milton Keynes — Zones, Fees & Times | Sree Svadista Prasada' },
  description: 'South Indian food delivery across all MK postcodes in 30–60 minutes. Delivery fees from £2.49, free over £28, £15 minimum — or collect and save 10%.',
  alternates: { canonical: `${BASE_URL}/delivery` },
  openGraph: {
    title: 'Indian Food Delivery Milton Keynes | Sree Svadista Prasada',
    description: 'South Indian food delivery across all MK postcodes in 30–60 minutes. Fees from £2.49, free over £28 — or collect and save 10%.',
    type: 'website',
    url: `${BASE_URL}/delivery`,
    siteName: 'Sree Svadista Prasada',
    locale: 'en_GB',
    images: [{ url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80', width: 1200, height: 630, alt: 'Indian food delivery Milton Keynes' }],
  },
};

// Mirrors backend/routes/orders.py POSTCODE_ZONES + fee tables — the checkout
// engine is the source of truth; keep this page in sync when zones change.
const ZONES = [
  { zone: 'Zone 1', miles: '0–2 miles', districts: 'MK8, MK11, MK12, MK13, MK19', fee: '£2.49', freeOver: '£28' },
  { zone: 'Zone 2', miles: '2–5 miles', districts: 'MK5, MK6, MK9, MK14, MK16', fee: '£2.99', freeOver: '£30' },
  { zone: 'Zone 3', miles: '5–8 miles', districts: 'MK2, MK3, MK4, MK7, MK10, MK15', fee: '£3.99', freeOver: '£35' },
  { zone: 'Zone 4', miles: '8–12 miles', districts: 'MK1, MK17, MK18', fee: '£4.99', freeOver: '£40' },
];

const FAQS = [
  { q: 'Which Milton Keynes postcodes do you deliver to?', a: 'We deliver to every MK district — MK1 to MK19 — from our Greenleys kitchen (MK12). That covers Wolverton, Stony Stratford, Bletchley, Newport Pagnell, Central MK, Furzton, Walnut Tree and everywhere in between. Enter your postcode at checkout to see your exact fee.' },
  { q: 'How much does delivery cost?', a: 'Delivery fees are distance-based, from £2.49 in Zone 1 (MK8, MK11, MK12, MK13, MK19) to £4.99 in Zone 4 (MK1, MK17, MK18). Delivery is free once your order passes the zone threshold — from £28 in Zone 1.' },
  { q: 'How long does delivery take?', a: 'Delivery across Milton Keynes takes 30–60 minutes — every dish is cooked fresh to order, never held under a heat lamp.' },
  { q: 'Is there a minimum order?', a: 'Yes, £15 for both delivery and collection. Delivery orders between £15 and £19.99 also carry a £1.50 small-order fee — collection never does.' },
  { q: 'Can I collect instead and save money?', a: 'Yes — collection orders get 10% off and skip the delivery and small-order fees. Pick a 15-minute collection slot at checkout and your food is ready when you arrive.' },
  { q: 'Do you deliver to Edinburgh or Glasgow?', a: 'Not yet — Edinburgh and Glasgow are coming soon. Register your interest on our city pages and we will tell you the moment we launch.' },
];

const jsonLd = [
  faqSchema(FAQS),
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Delivery', item: `${BASE_URL}/delivery` },
    ],
  },
];

export default function DeliveryPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
        {/* Hero */}
        <section className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)]" style={{ backgroundColor: '#800020' }}>
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-14">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Food Delivery in Milton Keynes
            </h1>
            <p className="text-base md:text-lg text-gray-200 leading-relaxed max-w-2xl">
              Authentic Andhra food, cooked fresh in Greenleys and delivered across every MK postcode in 30–60 minutes.
              Prefer to swing by? Collection saves you 10%.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="/order" className="px-6 py-3 text-sm font-semibold rounded-sm" style={{ backgroundColor: '#F4C430', color: '#2D2422' }}>
                Order Now
              </Link>
              <Link href="/menu" className="px-6 py-3 text-sm font-semibold rounded-sm border text-white" style={{ borderColor: 'rgba(255,255,255,0.5)' }}>
                Browse the Menu
              </Link>
            </div>
          </div>
        </section>

        {/* Zone table */}
        <section className="py-14 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
              Delivery zones &amp; fees
            </h2>
            <p className="text-sm text-gray-500 mb-6">Distance is measured from our kitchen in Greenleys (MK12). Your exact fee shows automatically at checkout.</p>
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
              <table className="w-full text-sm bg-white" style={{ minWidth: 560 }}>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider" style={{ color: '#5C4B47', backgroundColor: '#F9F6EE' }}>
                    <th className="px-4 py-3 font-bold">Zone</th>
                    <th className="px-4 py-3 font-bold">Distance</th>
                    <th className="px-4 py-3 font-bold">Postcodes</th>
                    <th className="px-4 py-3 font-bold">Delivery fee</th>
                    <th className="px-4 py-3 font-bold">Free over</th>
                  </tr>
                </thead>
                <tbody>
                  {ZONES.map(z => (
                    <tr key={z.zone} style={{ borderTop: '1px solid rgba(128,0,32,0.08)' }}>
                      <td className="px-4 py-3 font-bold" style={{ color: '#800020' }}>{z.zone}</td>
                      <td className="px-4 py-3">{z.miles}</td>
                      <td className="px-4 py-3">{z.districts}</td>
                      <td className="px-4 py-3">{z.fee}</td>
                      <td className="px-4 py-3">{z.freeOver}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              £15 minimum order for delivery · £1.50 small-order fee on orders under £20 · Edinburgh &amp; Glasgow{' '}
              <Link href="/edinburgh" className="underline font-semibold" style={{ color: '#800020' }}>coming soon</Link>.
            </p>
          </div>
        </section>

        {/* Collection */}
        <section className="py-14 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-start">
            <div>
              <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}>
                Collect &amp; save 10%
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Order online, pick a 15-minute collection slot, and your food is freshly packed when you arrive at our
                Greenleys kitchen — 24 Oxman Ln, Milton Keynes MK12 6LF. Collection orders get 10% off automatically,
                with no delivery or small-order fees.
              </p>
              <Link href="/order" className="inline-block px-6 py-3 text-sm font-semibold rounded-sm text-white" style={{ backgroundColor: '#800020' }}>
                Start a Collection Order
              </Link>
            </div>
            <div className="rounded-lg p-6 bg-white border" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
              <h3 className="text-base font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#2D2422' }}>Good to know</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Every dish cooked fresh to order — allow 40 minutes for the first available slot</li>
                <li>✓ Free delivery thresholds count after discounts</li>
                <li>✓ Dabba Wala subscribers get scheduled tiffin deliveries — see <Link href="/subscriptions" className="underline font-semibold" style={{ color: '#800020' }}>plans</Link></li>
                <li>✓ Feeding a crowd? <Link href="/catering" className="underline font-semibold" style={{ color: '#800020' }}>Catering</Link> covers events and corporate meals</li>
              </ul>
            </div>
          </div>
        </section>

        <FaqSection title="Delivery & collection — your questions" faqs={FAQS} />
      </main>
    </>
  );
}
