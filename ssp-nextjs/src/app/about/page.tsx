import type { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'About Us | Authentic Andhra & Telugu Food',
  description:
    "Learn about Sree Svadista Prasada — Milton Keynes' home for authentic South Indian food rooted in Andhra Pradesh and Telugu culinary tradition. Based in Greenleys, MK12.",
  alternates: { canonical: `${BUSINESS.website}/about` },
}

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #5C2406 0%, #92400E 60%, #B8860B 100%)' }} className="text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            About Sree Svadista Prasada
          </h1>
          <p className="text-amber-100 text-lg max-w-2xl">
            Milton Keynes&apos; home for authentic South Indian food.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="max-w-3xl">
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            We are Sree Svadista Prasada — Milton Keynes&apos; home for authentic South Indian food.
            Based in Greenleys (MK12), we cook the way your grandmother cooked: from scratch,
            with care, using spices and techniques passed down through Telugu and Andhra traditions.
            No shortcuts. No compromises. Just the real thing.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10" style={{ fontFamily: "'Playfair Display', serif" }}>Our story</h2>
          <p className="text-gray-700 mb-5 leading-relaxed">
            Sree Svadista Prasada was founded on a simple belief: that the South Indian community
            in Milton Keynes deserved access to genuine Telugu and Andhra food — the kind of
            home-style cooking that tastes like it came straight from your mother&apos;s kitchen.
            We serve Greenleys, Wolverton, Stony Stratford and the wider Milton Keynes area —
            offering takeaway collection and home delivery.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10" style={{ fontFamily: "'Playfair Display', serif" }}>
            Andhra &amp; Telugu food tradition
          </h2>
          <p className="text-gray-700 mb-8 leading-relaxed">
            Every dish on our menu reflects the culinary heritage of Andhra Pradesh and Telangana.
            From the bold heat of Andhra biryani and the tanginess of gongura chutney, to the
            comfort of idli-sambar and the crunch of a crispy dosa — we bring these traditions
            to Milton Keynes.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/menu" className="btn-primary">View our menu →</Link>
            <Link href="/dabba-wala" className="btn-secondary">Dabba Wala subscription</Link>
          </div>
        </div>
      </section>
    </>
  )
}
