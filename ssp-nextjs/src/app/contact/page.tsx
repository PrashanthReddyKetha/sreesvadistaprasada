import type { Metadata } from 'next'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'Contact & Order | South Indian Takeaway MK12',
  description: `Contact Sree Svadista Prasada in Greenleys, Milton Keynes MK12 6LF. Phone: ${BUSINESS.phone}. Order online for delivery to Greenleys, Wolverton, Stony Stratford and surrounding MK areas.`,
  alternates: { canonical: `${BUSINESS.website}/contact` },
}

export default function ContactPage() {
  return (
    <>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #5C2406 0%, #92400E 60%, #B8860B 100%)' }} className="text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Contact &amp; Order
          </h1>
          <p className="text-amber-100 text-lg">Get in touch or place your order online.</p>
        </div>
      </section>

      <div className="section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* NAP Block — critical for local SEO */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Find us</h2>
            <address className="not-italic space-y-3 text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">{BUSINESS.name}</p>
                <p>{BUSINESS.address.street}</p>
                <p>{BUSINESS.address.area}, {BUSINESS.address.city}</p>
                <p>{BUSINESS.address.postcode}</p>
              </div>
              <div>
                <a href={`tel:${BUSINESS.phoneIntl}`} className="font-semibold hover:underline text-lg" style={{ color: '#92400E' }}>
                  {BUSINESS.phone}
                </a>
              </div>
              <div>
                <a href={BUSINESS.website} className="hover:underline" style={{ color: '#92400E' }}>
                  sreesvadistaprasada.com
                </a>
              </div>
            </address>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Opening hours</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {BUSINESS.hours.map(h => (
                <li key={h.day} className="flex justify-between max-w-xs">
                  <span>{h.day}</span>
                  <span className={h.closed ? 'text-red-500' : ''}>
                    {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery areas + Order CTA */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Areas we deliver to</h2>
            <p className="text-gray-600 mb-4">We deliver South Indian food across:</p>
            <div className="flex flex-wrap mb-6">
              {BUSINESS.deliveryAreas.map(area => (
                <span key={area} className="area-tag">{area}</span>
              ))}
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Not sure if we deliver to you? Call us on{' '}
              <a href={`tel:${BUSINESS.phoneIntl}`} className="font-semibold hover:underline" style={{ color: '#92400E' }}>
                {BUSINESS.phone}
              </a>{' '}
              and we&apos;ll let you know.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order online</h2>
            <p className="text-gray-600 mb-5">
              The fastest way to order is online — choose your dishes, pay securely, and track your delivery.
            </p>
            <a href={BUSINESS.orderingApp} className="btn-primary block text-center">Order now →</a>

            {/* WhatsApp for snacks/catering */}
            <div className="mt-6 p-4 rounded-xl border" style={{ borderColor: 'rgba(37,211,102,0.3)', backgroundColor: 'rgba(37,211,102,0.05)' }}>
              <p className="text-sm text-gray-600 mb-2">For snacks, pickles, podis &amp; catering enquiries:</p>
              <a
                href={`https://wa.me/${BUSINESS.social.whatsapp.replace('+', '')}?text=${encodeURIComponent('Hi, I\'d like to enquire about your snacks/catering.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
