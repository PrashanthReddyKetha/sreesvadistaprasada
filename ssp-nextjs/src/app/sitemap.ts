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
  const itemRoutes: MetadataRoute.Sitemap = items.map(item => ({
    url: `${BASE_URL}/item/${item.id}`,
    priority: 0.7,
    changeFrequency: 'weekly',
    lastModified: item.updated_at ? new Date(item.updated_at) : now,
  }))

  return [...staticRoutes, ...itemRoutes]
}
