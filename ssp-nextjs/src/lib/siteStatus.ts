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

/** True only when the admin Delivery switch is on. Unknown counts as off. */
export async function getDeliveryEnabled(): Promise<boolean> {
  const data = await getJson('/kitchen-status')
  return data?.delivery_enabled === true
}
