import Link from 'next/link';
import { MapPin, Clock, ShoppingBag, CheckCircle } from 'lucide-react';

const MENU_CATEGORIES = [
  { label: 'Prasada — Pure Vegetarian', sub: 'Curries, biryani, dosas & more', href: '/prasada', emoji: '🌿' },
  { label: 'Svadista — Non-Veg', sub: 'Gongura chicken, Natu Kodi biryani & more', href: '/svadista', emoji: '🍗' },
  { label: 'Breakfast', sub: 'Idli, vada, dosas, poori — fresh every morning', href: '/breakfast', emoji: '🌅' },
  { label: 'Snacks & Pickles', sub: 'Handmade podis, pickles & nibbles', href: '/snacks', emoji: '🫙' },
  { label: 'Dabba Wala Subscriptions', sub: 'Weekly meal plans from £7 per meal', href: '/subscriptions', emoji: '🥡' },
  { label: 'Catering', sub: 'Events, temple prasada, corporate', href: '/catering', emoji: '🎊' },
];

const TRUST_POINTS = [
  'No MSG, no preservatives — traditional methods only',
  'Allergens clearly marked on every dish',
  'Prasada kitchen is fully separate — zero cross-contamination',
  'Spice levels 1–5: mild to fiery, your choice',
  'Same-day cooking — never reheated from the day before',
];

export default function CityPage({ data, jsonLd }) {
  const { city, tagline, deliveryTime, minOrder, freeDeliveryThreshold, areas, isKitchen } = data;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="pt-[calc(32px+4rem)] md:pt-[calc(32px+5rem)] relative overflow-hidden"
        style={{ minHeight: 'min(50vh, 420px)', backgroundColor: '#800020' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #F4C430 0%, transparent 60%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 flex flex-col justify-center h-full">
          <div className="max-w-2xl">
            <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: '#F4C430' }} />
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              South Indian Food Delivery in {city}
            </h1>
            <p className="text-base md:text-lg text-gray-200 mb-8 leading-relaxed">
              {tagline}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/menu">
                <button
                  className="px-6 py-3 text-sm font-semibold rounded-sm transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: '#F4C430', color: '#2D2422' }}
                >
                  Browse Menu
                </button>
              </Link>
              <Link href="/subscriptions">
                <button
                  className="px-6 py-3 text-sm font-semibold rounded-sm border transition-all duration-300 hover:bg-white hover:text-[#800020]"
                  style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
                >
                  Dabba Wala Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Stats Strip */}
      <div style={{ backgroundColor: '#F9F6EE', borderBottom: '1px solid rgba(128,0,32,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Clock size={16} />, label: 'Delivery Time', value: deliveryTime },
            { icon: <ShoppingBag size={16} />, label: 'Minimum Order', value: minOrder },
            { icon: <MapPin size={16} />, label: 'Free Delivery', value: `Orders over ${freeDeliveryThreshold}` },
            { icon: <CheckCircle size={16} />, label: 'UK-wide Shipping', value: 'Snacks & pickles' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0" style={{ color: '#800020' }}>{icon}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#800020' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: '#2D2422' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Categories */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
            >
              What we bring to {city}
            </h2>
            <p className="text-sm text-gray-500 mt-2">Every order cooked fresh — never pre-made, never frozen.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MENU_CATEGORIES.map(({ label, sub, href, emoji }) => (
              <Link key={href} href={href}>
                <div
                  className="group p-5 rounded-lg bg-white border transition-all duration-200 hover:shadow-md hover:border-[#800020] cursor-pointer h-full"
                  style={{ borderColor: 'rgba(128,0,32,0.1)' }}
                >
                  <div className="text-3xl mb-3">{emoji}</div>
                  <h3
                    className="text-base font-bold mb-1 group-hover:text-[#800020] transition-colors"
                    style={{ color: '#2D2422', fontFamily: "'Playfair Display', serif" }}
                  >
                    {label}
                  </h3>
                  <p className="text-sm text-gray-500">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Areas */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#F9F6EE' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="w-10 h-0.5 mb-3" style={{ backgroundColor: '#F4C430' }} />
              <h2
                className="text-3xl font-bold mb-4 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
              >
                Delivering across {city}
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                We cover a wide area{isKitchen ? ' — this is where our kitchen is based' : ''}. Not sure if we reach you?{' '}
                <a
                  href="https://wa.me/447307119962?text=Hi,%20do%20you%20deliver%20to%20my%20area?"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline"
                  style={{ color: '#800020' }}
                >
                  WhatsApp us your postcode.
                </a>
              </p>
              <div className="flex flex-wrap gap-2">
                {areas.map(area => (
                  <span
                    key={area}
                    className="px-3 py-1.5 text-xs font-medium rounded-full"
                    style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Dabba Wala */}
            <div
              className="rounded-lg p-7"
              style={{ backgroundColor: '#800020', color: '#FDFBF7' }}
            >
              <div className="text-4xl mb-3">🥡</div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Dabba Wala in {city}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
                A fresh, home-style South Indian dabba delivered to your door every day or every week.
                Rice, curry, dal, sambar, pickle, papad — the whole meal, every time.
              </p>
              <ul className="space-y-1.5 mb-6">
                {['Starting from £7 per meal', 'Weekly & monthly plans', 'Veg (Prasada) or non-veg (Svadista)', 'Pause or cancel anytime'].map(pt => (
                  <li key={pt} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <span style={{ color: '#F4C430' }}>✓</span> {pt}
                  </li>
                ))}
              </ul>
              <Link href="/subscriptions">
                <button
                  className="w-full py-3 text-sm font-semibold rounded-sm transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: '#F4C430', color: '#2D2422' }}
                >
                  See Dabba Wala Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-10 h-0.5 mx-auto mb-3" style={{ backgroundColor: '#F4C430' }} />
          <h2
            className="text-3xl font-bold mb-8 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#800020' }}
          >
            Food you can trust
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {TRUST_POINTS.map(pt => (
              <div key={pt} className="flex items-start gap-3 p-4 rounded-lg bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#800020' }} />
                <p className="text-sm text-gray-700 leading-relaxed">{pt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-8" style={{ backgroundColor: '#800020' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to order in {city}?
          </h2>
          <p className="text-sm text-gray-200 mb-7">
            Browse the full menu or start a Dabba Wala subscription.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/menu">
              <button
                className="px-7 py-3 text-sm font-semibold rounded-sm transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#F4C430', color: '#2D2422' }}
              >
                Browse Full Menu
              </button>
            </Link>
            <a
              href="https://wa.me/447307119962?text=Hi,%20I%20want%20to%20order%20South%20Indian%20food."
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                className="px-7 py-3 text-sm font-semibold rounded-sm border border-white text-white transition-all duration-300 hover:bg-white hover:text-[#800020]"
              >
                Order on WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
