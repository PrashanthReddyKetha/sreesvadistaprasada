import type { Metadata } from 'next'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'South Indian Catering Milton Keynes | Weddings, Events & Corporate',
  description:
    'Authentic South Indian catering in Milton Keynes for weddings, birthday parties, corporate events, and temple functions. Vegetarian and non-vegetarian menus. Contact us for a quote.',
  alternates: { canonical: `${BUSINESS.website}/catering` },
}

const events = [
  'Weddings & receptions',
  'Temple functions & religious events',
  'Birthday parties & celebrations',
  'Corporate lunches & office events',
  'Community gatherings & cultural events',
]

export default function CateringPage() {
  return (
    <>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #5C2406 0%, #92400E 60%, #B8860B 100%)' }} className="text-white">
        <div className="section py-20">
          <h1 className="text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            South Indian Catering in Milton Keynes — Weddings, Events &amp; Corporate
          </h1>
          <p className="text-amber-100 text-lg mb-8 max-w-2xl">
            Planning an event in Milton Keynes? Let Sree Svadista Prasada bring authentic South Indian food to your guests.
          </p>
          <a href={`tel:${BUSINESS.phoneIntl}`} className="bg-white font-semibold px-6 py-3 rounded-lg hover:shadow-md transition-all" style={{ color: '#92400E' }}>
            Call {BUSINESS.phone}
          </a>
        </div>
      </section>

      {/* MENUS */}
      <section className="section">
        <h2 className="section-heading">Authentic Andhra catering menus</h2>
        <p className="text-gray-600 max-w-2xl mb-8 leading-relaxed">
          Our catering menu features traditional Andhra and Telugu dishes — biryanis, curries, dosas, sweets and more — all freshly prepared and delivered hot. Vegetarian and non-vegetarian South Indian catering menus available.
        </p>
      </section>

      {/* EVENTS */}
      <section style={{ backgroundColor: '#FEF3E2' }}>
        <div className="section">
          <h2 className="section-heading">Events we cater for</h2>
          <ul className="space-y-3 max-w-xl">
            {events.map(e => (
              <li key={e} className="flex gap-3 text-gray-700">
                <span className="font-bold" style={{ color: '#92400E' }}>→</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="section text-center">
        <h2 className="section-heading">Get a South Indian catering quote in Milton Keynes</h2>
        <p className="text-gray-600 mb-6">Contact us to discuss your event and receive a personalised catering quote.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/contact" className="btn-primary">Request a quote →</a>
          <a href={`tel:${BUSINESS.phoneIntl}`} className="btn-secondary">Call {BUSINESS.phone}</a>
        </div>
      </section>
    </>
  )
}
