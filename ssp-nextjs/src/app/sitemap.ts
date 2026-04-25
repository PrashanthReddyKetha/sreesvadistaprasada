import { MetadataRoute } from 'next'

const BASE_URL = 'https://www.sreesvadistaprasada.com'
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com'

async function getMenuItems(): Promise<{ id: string; updated_at?: string }[]> {
  try {
    const res = await fetch(`${API_URL}/api/menu?available=true`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,               priority: 1.0,  changeFrequency: 'daily',   lastModified: now },
    { url: `${BASE_URL}/menu`,           priority: 0.9,  changeFrequency: 'daily',   lastModified: now },
    { url: `${BASE_URL}/prasada`,        priority: 0.9,  changeFrequency: 'daily',   lastModified: now },
    { url: `${BASE_URL}/svadista`,       priority: 0.9,  changeFrequency: 'daily',   lastModified: now },
    { url: `${BASE_URL}/breakfast`,      priority: 0.8,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE_URL}/street-food`,    priority: 0.8,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE_URL}/ragi-specials`,  priority: 0.8,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE_URL}/drinks`,         priority: 0.7,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE_URL}/snacks`,         priority: 0.8,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE_URL}/subscriptions`,  priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE_URL}/catering`,       priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE_URL}/story`,          priority: 0.6,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE_URL}/gallery`,        priority: 0.6,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE_URL}/contact`,        priority: 0.7,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE_URL}/faq`,            priority: 0.7,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE_URL}/privacy-policy`, priority: 0.3,  changeFrequency: 'yearly',  lastModified: now },
    { url: `${BASE_URL}/terms`,          priority: 0.3,  changeFrequency: 'yearly',  lastModified: now },
  ]

  const items = await getMenuItems()
  const itemRoutes: MetadataRoute.Sitemap = items
    .filter((item: any) => item.slug && item.category && (item.subcategory || true))
    .map((item: any) => {
      const CATEGORY_TO_MENU: Record<string, string> = {
        nonVeg: 'svadista', veg: 'prasada', breakfast: 'breakfast',
        pickles: 'snacks', podis: 'snacks', drinks: 'drinks',
        streetFood: 'street-food', ragiSpecials: 'ragi-specials',
      }
      const CATEGORY_DEFAULT_SUB: Record<string, string> = {
        pickles: 'pickles', podis: 'podis', drinks: 'beverages',
        streetFood: 'street-bites', ragiSpecials: 'specials',
      }
      const slugify = (t: string) => t.toLowerCase().replace(/[^\w\s-]/g,'').trim().replace(/[\s_]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
      const menu = CATEGORY_TO_MENU[item.category] || item.category
      const subsection = item.subcategory ? slugify(item.subcategory) : (CATEGORY_DEFAULT_SUB[item.category] || 'general')
      return {
        url: `${BASE_URL}/${menu}/${subsection}/${item.slug}`,
        priority: 0.7,
        changeFrequency: 'weekly' as const,
        lastModified: item.updated_at ? new Date(item.updated_at) : now,
      }
    })

  return [...staticRoutes, ...itemRoutes]
}
