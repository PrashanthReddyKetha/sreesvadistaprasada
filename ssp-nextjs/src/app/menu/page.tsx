import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BUSINESS } from '@/lib/business'

// ISR: regenerate every hour so menu updates appear without a full redeploy
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Menu | Dosas, Biryani & South Indian Food',
  description:
    'Browse our full South Indian menu. Crispy dosas, fluffy idlis, rich Andhra biryanis, fresh curries, pickles & podis. Order online for delivery in Milton Keynes, Greenleys & Wolverton.',
  keywords: [
    'dosa delivery Milton Keynes',
    'biryani delivery Milton Keynes',
    'South Indian menu MK',
    'idli takeaway Milton Keynes',
    'Andhra biryani near me',
    'crispy dosa Milton Keynes',
  ],
  alternates: { canonical: `${BUSINESS.website}/menu` },
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  is_veg?: boolean
  category: string
  subcategory?: string
  available: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://svadista-backend.onrender.com/api'

const MENU_SECTIONS = [
  { id: 'svadista', label: 'Svadista (Non-Veg)', category: 'nonveg', anchor: 'nonveg' },
  { id: 'prasada', label: 'Prasada (Veg)', category: 'veg', anchor: 'veg' },
  { id: 'breakfast', label: 'Breakfast', category: 'breakfast', anchor: 'breakfast' },
  { id: 'ragi', label: 'Ragi Specials', category: 'ragiSpecials', anchor: 'ragi' },
  { id: 'street', label: 'Evening Delights', category: 'streetFood', anchor: 'street' },
  { id: 'drinks', label: 'Drinks', category: 'drinks', anchor: 'drinks' },
  { id: 'snacks', label: 'Snacks, Pickles & Podis', category: 'pickles', anchor: 'snacks' },
]

async function getMenuSection(category: string): Promise<MenuItem[]> {
  try {
    const res = await fetch(`${API_URL}/menu?category=${category}&available=true`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function fmt(p: number) {
  return `£${parseFloat(String(p)).toFixed(2)}`
}

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article className="bg-white rounded-xl overflow-hidden border flex flex-col" style={{ borderColor: 'rgba(92,36,6,0.08)', boxShadow: '0 2px 12px rgba(92,36,6,0.06)' }}>
      {item.image && (
        <div className="relative h-40 overflow-hidden flex-shrink-0">
          <Image
            src={item.image}
            alt={`${item.name} — South Indian dish from ${BUSINESS.name}, Milton Keynes`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {item.is_veg !== undefined && (
            <span
              className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: item.is_veg ? 'rgba(22,101,52,0.85)' : 'rgba(185,28,28,0.85)' }}
            >
              {item.is_veg ? 'Veg' : 'Non-Veg'}
            </span>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-sm leading-snug" style={{ color: '#5C2406', fontFamily: "'Playfair Display', serif" }}>{item.name}</h3>
          <span className="text-sm font-bold flex-shrink-0" style={{ color: '#92400E' }}>{fmt(item.price)}</span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{item.description}</p>
        )}
        <a
          href={BUSINESS.orderingApp}
          className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#92400E' }}
        >
          Order now →
        </a>
      </div>
    </article>
  )
}

function MenuSection({ title, items, id }: { title: string; items: MenuItem[]; id: string }) {
  if (items.length === 0) return null
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b" style={{ color: '#5C2406', borderColor: 'rgba(92,36,6,0.15)', fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => <MenuCard key={item.id} item={item} />)}
      </div>
    </section>
  )
}

export default async function MenuPage() {
  // Fetch all sections in parallel
  const [nonveg, veg, breakfast, ragi, street, drinks, pickles, podis] = await Promise.all([
    getMenuSection('nonveg'),
    getMenuSection('veg'),
    getMenuSection('breakfast'),
    getMenuSection('ragiSpecials'),
    getMenuSection('streetFood'),
    getMenuSection('drinks'),
    getMenuSection('pickles'),
    getMenuSection('podis'),
  ])

  const snacks = [...pickles, ...podis]

  return (
    <div style={{ backgroundColor: '#FDFBF7' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #5C2406 0%, #92400E 60%, #B8860B 100%)' }} className="text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            South Indian Menu — Dosas, Biryanis, Curries &amp; More
          </h1>
          <p className="text-amber-100 max-w-2xl mb-6 leading-relaxed">
            Browse our full menu of authentic South Indian dishes, made fresh to order.
            Everything prepared using traditional Andhra and Telugu recipes.
            Order online for delivery across Milton Keynes.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href={BUSINESS.orderingApp} className="bg-white font-semibold px-6 py-3 rounded-lg transition-all hover:shadow-md" style={{ color: '#92400E' }}>Order now →</a>
            <a href={`tel:${BUSINESS.phoneIntl}`} className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Call {BUSINESS.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Jump links */}
      <div className="sticky top-16 z-20 bg-white border-b shadow-sm px-4 py-2" style={{ borderColor: 'rgba(92,36,6,0.1)' }}>
        <nav aria-label="Menu sections" className="max-w-7xl mx-auto flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {MENU_SECTIONS.map(s => (
            <a key={s.anchor} href={`#${s.anchor}`} className="text-xs whitespace-nowrap font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-amber-800 hover:text-white hover:border-amber-800" style={{ borderColor: 'rgba(92,36,6,0.3)', color: '#5C2406' }}>
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <MenuSection id="nonveg" title="Svadista — Non-Veg" items={nonveg} />
        <MenuSection id="veg" title="Prasada — Pure Vegetarian" items={veg} />
        <MenuSection id="breakfast" title="Breakfast" items={breakfast} />
        <MenuSection id="ragi" title="Ragi Specials" items={ragi} />
        <MenuSection id="street" title="Evening Delights" items={street} />
        <MenuSection id="drinks" title="Juices & Soft Drinks" items={drinks} />
        <MenuSection id="snacks" title="Snacks, Pickles & Podis" items={snacks} />

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center mt-8" style={{ backgroundColor: '#FEF3E2' }}>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#5C2406', fontFamily: "'Playfair Display', serif" }}>
            Ready to order South Indian food in Milton Keynes?
          </h2>
          <p className="text-gray-600 mb-5">
            Delivery across Greenleys, Wolverton, Stony Stratford and surrounding MK areas.
          </p>
          <a href={BUSINESS.orderingApp} className="btn-primary text-lg px-8">Order now →</a>
        </div>
      </div>
    </div>
  )
}
