import type { Metadata } from 'next'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'Dabba Wala Meal Subscription | Weekly Indian Food Delivery Milton Keynes',
  description:
    "Subscribe to our Dabba Wala — a weekly home-cooked South Indian meal plan delivered to your door in Milton Keynes. Fresh Andhra & Telugu food every week. No cook nights sorted!",
  keywords: [
    'Indian meal subscription Milton Keynes',
    'tiffin delivery Milton Keynes',
    'weekly Indian meal delivery MK',
    'home cooked Indian food delivery Milton Keynes',
    'dabba delivery Milton Keynes',
    'Indian food subscription MK12',
  ],
  alternates: { canonical: `${BUSINESS.website}/dabba-wala` },
}

const dabbaSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Dabba Wala — Weekly South Indian Meal Subscription',
  description: 'Weekly home-cooked South Indian meal plan delivered to your door in Milton Keynes. Fresh Andhra and Telugu food every week.',
  brand: { '@type': 'Brand', name: BUSINESS.name },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'GBP',
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'Organization', name: BUSINESS.name },
  },
  category: 'Meal Subscription',
  areaServed: { '@type': 'City', name: 'Milton Keynes' },
}

const steps = [
  { n: '01', title: 'Subscribe online', desc: 'Sign up at sreesvadistaprasada.com — choose your plan.' },
  { n: '02', title: 'We plan your menu', desc: 'A fresh weekly menu of South Indian dishes is prepared for you.' },
  { n: '03', title: 'We cook fresh', desc: 'Every meal is made from scratch using Andhra and Telugu recipes.' },
  { n: '04', title: 'Delivered to your door', desc: 'Your Dabba is delivered across Greenleys, Wolverton and MK on schedule.' },
]

const mealItems = ['Rice', 'Dal', 'Sabzi', 'Curry', 'Pickle', 'Papad']

export default function DabbaWalaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dabbaSchema) }} />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #5C2406 0%, #92400E 60%, #B8860B 100%)' }} className="text-white">
        <div className="section py-20">
          <div className="max-w-2xl">
            <span className="inline-block bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
              Only in Milton Keynes
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dabba Wala — Weekly South Indian Meal Subscription in Milton Keynes
            </h1>
            <p className="text-amber-100 text-lg mb-8 leading-relaxed">
              Tired of cooking every night? Milton Keynes&apos; only weekly
              home-cooked South Indian meal subscription delivers fresh Andhra
              and Telugu dishes straight to your door.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={BUSINESS.orderingApp} className="bg-white font-semibold px-6 py-3 rounded-lg hover:shadow-md transition-all" style={{ color: '#92400E' }}>
                Subscribe now
              </a>
              <a href={`tel:${BUSINESS.phoneIntl}`} className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
                Call {BUSINESS.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="section">
        <h2 className="section-heading">What you get each week</h2>
        <p className="text-gray-600 max-w-2xl mb-8 leading-relaxed">
          Think rice, dal, sabzi, curry, pickle, papad — a complete home-style
          South Indian meal, made fresh and delivered on schedule. Our weekly
          Indian meal delivery in Milton Keynes means you get the comfort of
          ghar ka khana without the effort.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {mealItems.map(item => (
            <div key={item} className="card text-center" style={{ borderColor: 'rgba(92,36,6,0.1)' }}>
              <span className="font-semibold text-gray-800">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ backgroundColor: '#FEF3E2' }}>
        <div className="section">
          <h2 className="section-heading">Perfect for</h2>
          <ul className="space-y-4 max-w-xl">
            {[
              'Working families who want home-cooked meals without the hassle',
              'Students and professionals in Greenleys, Wolverton and across MK',
              'Anyone craving authentic Andhra and Telugu food delivered weekly',
            ].map(item => (
              <li key={item} className="flex gap-3 text-gray-700">
                <span className="font-bold mt-0.5" style={{ color: '#166534' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <h2 className="section-heading text-center mb-12">How the Dabba Wala works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(s => (
            <div key={s.n} className="card text-center" style={{ borderColor: 'rgba(92,36,6,0.1)' }}>
              <div className="text-3xl font-bold mb-3" style={{ color: '#92400E', fontFamily: "'Playfair Display', serif" }}>{s.n}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DELIVERY AREAS */}
      <section className="section pt-0">
        <h2 className="section-heading">Meal subscription delivery across Milton Keynes</h2>
        <p className="text-gray-600 mb-4">
          We deliver the Dabba Wala to:{' '}
          {BUSINESS.deliveryAreas.map((a, i) => (
            <span key={a}>
              <strong>{a}</strong>
              {i < BUSINESS.deliveryAreas.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: '#1C0A00' }} className="text-white">
        <div className="section text-center py-16">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Subscribe to South Indian meal delivery in Milton Keynes
          </h2>
          <p className="text-gray-400 mb-8">
            Fresh home-cooked tiffin delivery to Greenleys, Wolverton, and surrounding MK postcodes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={BUSINESS.orderingApp} className="btn-primary text-lg px-8">Subscribe now →</a>
            <a href={`tel:${BUSINESS.phoneIntl}`} className="border-2 border-gray-600 text-white font-semibold px-8 py-3 rounded-lg hover:border-gray-400 transition-colors">
              Call {BUSINESS.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
