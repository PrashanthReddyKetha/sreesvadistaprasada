import Link from 'next/link'
import { BUSINESS } from '@/lib/business'

/**
 * Footer — NAP (Name, Address, Phone) must appear on every page.
 * Critical for local SEO. Do not remove or modify the address block.
 */
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="text-gray-300 mt-16" style={{ backgroundColor: '#1C0A00' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* NAP Block — critical for local SEO */}
          <div>
            <h2 className="text-white font-semibold text-base mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              {BUSINESS.name}
            </h2>
            {/* schema.org address markup for crawlers */}
            <address className="not-italic text-sm leading-7 text-gray-400"
              itemScope itemType="https://schema.org/PostalAddress">
              <span itemProp="streetAddress">{BUSINESS.address.street}</span><br />
              <span itemProp="addressLocality">{BUSINESS.address.area}</span>,{' '}
              <span itemProp="addressRegion">{BUSINESS.address.city}</span><br />
              <span itemProp="postalCode">{BUSINESS.address.postcode}</span>
            </address>
            <a
              href={`tel:${BUSINESS.phoneIntl}`}
              className="block mt-2 text-sm text-amber-400 hover:text-white transition-colors"
              aria-label={`Call us on ${BUSINESS.phone}`}
            >
              {BUSINESS.phone}
            </a>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-white font-semibold text-base mb-3">Quick links</h2>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2 text-sm">
                {[
                  ['/menu', 'Menu'],
                  ['/dabba-wala', 'Dabba Wala subscription'],
                  ['/catering', 'Catering'],
                  ['/about', 'About us'],
                  ['/contact', 'Contact & order'],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Opening hours */}
          <div>
            <h2 className="text-white font-semibold text-base mb-3">Opening hours</h2>
            <ul className="text-sm space-y-1 text-gray-400">
              {BUSINESS.hours.map(h => (
                <li key={h.day} className="flex justify-between gap-4">
                  <span>{h.day}</span>
                  <span>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              Delivery across Greenleys, Wolverton, Stony Stratford &amp; surrounding MK areas.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {year} {BUSINESS.name}. All rights reserved.</p>
          <p>Authentic South Indian takeaway &amp; delivery in Milton Keynes, MK12.</p>
        </div>
      </div>
    </footer>
  )
}
