/**
 * Facts that live in the admin panel and must read the same everywhere:
 * opening hours (Collection Times tab) and whether delivery is switched on.
 * Server-side only — used by pages when they build metadata and structured data.
 */
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com'

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

type DayHours = { closed?: boolean; open: string; close: string }

async function getJson(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, { next: { revalidate: 600 } })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

/** schema.org OpeningHoursSpecification built from the hours set in admin; null if they can't be read. */
export async function getOpeningHoursSpec(): Promise<object[] | null> {
  const data = await getJson('/opening-hours')
  const days: Record<string, DayHours> | undefined = data?.days
  if (!days) return null
  const groups = new Map<string, string[]>()
  for (const key of DAY_ORDER) {
    const d = days[key]
    if (!d || d.closed || !d.open || !d.close) continue
    const slot = `${d.open}-${d.close}`
    groups.set(slot, [...(groups.get(slot) || []), DAY_NAMES[key]])
  }
  return Array.from(groups.entries()).map(([slot, dayOfWeek]) => {
    const [opens, closes] = slot.split('-')
    return { '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes }
  })
}

/** Opening hours as short lines ("Mon – Thu: 8am – 8:30pm") from the hours set in admin; null if they can't be read. */
export async function getOpeningHoursText(): Promise<string[] | null> {
  const data = await getJson('/opening-hours')
  const days: Record<string, DayHours> | undefined = data?.days
  if (!days) return null
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 === 0 ? 12 : h % 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`
  }
  const runs: { first: string; last: string; label: string }[] = []
  for (const key of DAY_ORDER) {
    const d = days[key]
    if (!d) continue
    const label = d.closed || !d.open || !d.close ? 'Closed' : `${fmt(d.open)} – ${fmt(d.close)}`
    const prev = runs[runs.length - 1]
    if (prev && prev.label === label) prev.last = key
    else runs.push({ first: key, last: key, label })
  }
  const short = (key: string) => DAY_NAMES[key].slice(0, 3)
  return runs.length ? runs.map(r => `${short(r.first)}${r.last !== r.first ? ` – ${short(r.last)}` : ''}: ${r.label}`) : null
}

// Only the fields the home page cards render
const slimItem = (i: any) => ({
  id: i.id, name: i.name, slug: i.slug, description: i.description, price: i.price, image: i.image,
  is_veg: i.is_veg, spice_level: i.spice_level, category: i.category, subcategory: i.subcategory,
  allergens: i.allergens, tag: i.tag, sold_out_today: i.sold_out_today, preorder_only: i.preorder_only,
})

/** Featured dishes from the live menu, so the home page's first HTML shows real dishes and prices. */
export async function getFeaturedItems(): Promise<any[]> {
  const data = await getJson('/menu?available=true&featured=true')
  return Array.isArray(data) ? data.map(slimItem) : []
}

/** The dish behind the home page's "This Week's Favourite" card (live price and link). */
export async function getChefSpecialItem(): Promise<any | null> {
  const data = await getJson('/menu?available=true&search=Karam+Dosa')
  return Array.isArray(data) && data[0] ? slimItem(data[0]) : null
}

/** The kitchen's own photos of dishes on sale, by dish address — so marketing sections show the real food, not stock pictures. */
export async function getDishPhotos(): Promise<Record<string, { name: string; image: string }>> {
  const data = await getJson('/menu?available=true')
  const out: Record<string, { name: string; image: string }> = {}
  if (Array.isArray(data)) {
    for (const i of data) {
      if (i.slug && typeof i.image === 'string' && i.image.startsWith('http') && !i.image.includes('unsplash.com')) {
        out[i.slug] = { name: i.name, image: i.image }
      }
    }
  }
  return out
}

/** True only when the admin Delivery switch is on. Unknown counts as off. */
export async function getDeliveryEnabled(): Promise<boolean> {
  const data = await getJson('/kitchen-status')
  return data?.delivery_enabled === true
}
