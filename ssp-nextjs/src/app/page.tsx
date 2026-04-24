import type { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'Sree Svadista Prasada | South Indian Takeaway Milton Keynes',
  description:
    'Authentic South Indian takeaway in Greenleys, Milton Keynes. Order dosas, idlis, biryani & curries online for delivery or collection. Try our Dabba Wala weekly meal subscription. Serving MK12, Wolverton & surrounding areas.',
  alternates: { canonical: BUSINESS.website },
}

const services = [
  {
    title: 'Takeaway & Delivery',
    icon: '🍱',
    desc: 'Order online and get your South Indian feast delivered fresh across Greenleys, Wolverton, Stony Stratford and the wider Milton Keynes area.',
    cta: 'Order now',
    href: BUSINESS.orderingApp,
    external: true,
  },
  {
    title: 'Dabba Wala',
    icon: '🎁',
    desc: 'Our unique weekly meal subscription delivers fresh home-cooked South Indian food to your door every week — the only service of its kind in Milton Keynes.',
    cta: 'Learn more',
    href: '/dabba-wala',
    external: false,
  },
  {
    title: 'Catering',
    icon: '🌿',
    desc: 'We cater for weddings, corporate functions, birthday parties, and temple events across Milton Keynes with authentic Andhra and Telugu menus.',
    cta: 'Catering enquiries',
    href: '/catering',
    external: false,
  },
]

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #5C2406 0%, #92400E 60%, #B8860B 100%)' }} className="text-white">
        <div className="section text-center py-24">
          <div className="inline-flex items-center gap-2 mb-4 text-amber-300 text-sm font-medium tracking-widest uppercase">
            <span>✦</span>
            <span>Andhra &amp; Telugu Tradition</span>
            <span>✦</span>
          </div>
          {/* Primary keyword in H1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            South Indian Takeaway &amp; Delivery<br className="hidden sm:block" /> in Milton Keynes
          </h1>
          <p className="text-xl text-amber-100 mb-4 max-w-2xl mx-auto">
            Soul-warming Andhra &amp; Telugu home cooking — delivered to your door
            across Greenleys, Wolverton &amp; Milton Keynes.
          </p>
          <p className="text-amber-200 mb-10 max-w-xl mx-auto">
            Crispy dosas, fluffy idlis, rich Andhra biryanis, flavourful curries,
            and freshly made pickles &amp; podis. Vegetarian and non-vegetarian options.
            Order online for fast delivery or collection from MK12.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={BUSINESS.orderingApp} className="bg-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:shadow-lg hover:scale-105 active:scale-95" style={{ color: '#92400E' }}>
              Order now
            </a>
            <Link href="/menu" className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-amber-800 transition-colors text-lg">
              View menu
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <h2 className="section-heading text-center mb-12">What we offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map(s => (
            <article key={s.href} className="card text-center hover:-translate-y-1 transition-transform duration-300" style={{ borderColor: 'rgba(92,36,6,0.1)', boxShadow: '0 4px 20px rgba(92,36,6,0.08)' }}>
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{s.title}</h3>
              <p className="text-gray-600 mb-5 text-sm leading-relaxed">{s.desc}</p>
              {s.external ? (
                <a href={s.href} className="btn-secondary text-sm">{s.cta} →</a>
              ) : (
                <Link href={s.href} className="btn-secondary text-sm">{s.cta} →</Link>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ABOUT SNIPPET */}
      <section style={{ backgroundColor: '#FEF3E2' }}>
        <div className="section">
          <div className="max-w-2xl">
            <h2 className="section-heading">
              Home-style South Indian food, made with care
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Milton Keynes&apos; home for authentic Telugu and Andhra cooking.
              Every dish we make is rooted in tradition — using spices and
              techniques passed down through generations. No shortcuts.
              No compromises. Just real South Indian food.
            </p>
            <Link href="/about" className="btn-primary">
              Learn about us →
            </Link>
          </div>
        </div>
      </section>

      {/* DELIVERY AREAS — hyperlocal SEO */}
      <section className="section">
        <h2 className="section-heading text-center mb-8">
          Delivering across Milton Keynes
        </h2>
        <p className="text-center text-gray-600 mb-6">
          We deliver South Indian food to:
        </p>
        <div className="flex flex-wrap justify-center">
          {BUSINESS.deliveryAreas.map(area => (
            <span key={area} className="area-tag">{area}</span>
          ))}
        </div>
        <p className="text-center text-gray-600 mt-6">
          Order online or call{' '}
          <a href={`tel:${BUSINESS.phoneIntl}`} className="font-semibold hover:underline" style={{ color: '#92400E' }}>
            {BUSINESS.phone}
          </a>
        </p>
      </section>
    </>
  )
}
