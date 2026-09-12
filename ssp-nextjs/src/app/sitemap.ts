import { MetadataRoute } from 'next'
import { buildItemUrl } from '@/lib/itemUrl'

const BASE_URL = 'https://sreesvadistaprasada.com'
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com'

// Stable lastModified for static routes — bump when a page materially changes.
// (Reporting "modified now" on every regeneration teaches Google to ignore lastmod.)
const STATIC_LASTMOD = new Date('2026-09-12')

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
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,               priority: 1.0,  changeFrequency: 'daily',   lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/menu`,           priority: 0.9,  changeFrequency: 'daily',   lastModified: STATIC_LASTMOD },
    // Menu section pages
    { url: `${BASE_URL}/prasada`,                              priority: 0.9, changeFrequency: 'daily',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/prasada/bites-starters`,               priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/prasada/indo-chinese`,                 priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/prasada/curries`,                      priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/prasada/naivedyam`,                    priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/prasada/biriyanis-rice`,               priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/prasada/thalis-rice-bowls`,            priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista`,                             priority: 0.9, changeFrequency: 'daily',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista/starters`,                    priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista/indo-chinese`,                priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista/egg-specials`,                priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista/curries`,                     priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista/biriyani`,                    priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista/rice-bowls`,                  priority: 0.85, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/breakfast`,                            priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/breakfast/idli-vada`,                  priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/breakfast/dosas`,                      priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/breakfast/chicken-curry-combos`,       priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/breakfast/poori-others`,               priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/breakfast/english-breakfast`,          priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/snacks`,                               priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/snacks/pickles`,                       priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/snacks/podis`,                         priority: 0.8, changeFrequency: 'weekly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/street-food`,    priority: 0.8,  changeFrequency: 'weekly',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/ragi-specials`,  priority: 0.8,  changeFrequency: 'weekly',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/drinks`,         priority: 0.7,  changeFrequency: 'weekly',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/delivery`,       priority: 0.85, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/subscriptions`,  priority: 0.9,  changeFrequency: 'weekly',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/catering`,       priority: 0.8,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/story`,          priority: 0.6,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/gallery`,        priority: 0.6,  changeFrequency: 'weekly',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/contact`,        priority: 0.7,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/faq`,            priority: 0.7,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/privacy-policy`, priority: 0.3,  changeFrequency: 'yearly',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/terms`,          priority: 0.3,  changeFrequency: 'yearly',  lastModified: STATIC_LASTMOD },
    // About sub-pages
    { url: `${BASE_URL}/ragi-specials/about`,  priority: 0.85, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/subscriptions/about`,  priority: 0.85, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/svadista/about`,       priority: 0.8,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/prasada/about`,        priority: 0.8,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/breakfast/about`,      priority: 0.75, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    // City landing pages
    { url: `${BASE_URL}/milton-keynes`,  priority: 0.9,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/edinburgh`,      priority: 0.9,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/glasgow`,        priority: 0.9,  changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    // Blog + long-form content
    { url: `${BASE_URL}/blog`,                                       priority: 0.7, changeFrequency: 'weekly',  lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/blog/what-is-dabba-wala`,                    priority: 0.65, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/blog/south-indian-vs-north-indian-food`,     priority: 0.65, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/blog/ragi-health-benefits`,                  priority: 0.65, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
    { url: `${BASE_URL}/gongura`,                                    priority: 0.7, changeFrequency: 'monthly', lastModified: STATIC_LASTMOD },
  ]

  const items = await getMenuItems()
  // Same URL builder the pages and generateStaticParams use — the sitemap can
  // never drift from the real item URLs.
  const itemRoutes: MetadataRoute.Sitemap = items
    .filter((item: any) => item.slug && item.category)
    .map((item: any) => ({
      url: `${BASE_URL}${buildItemUrl(item)}`,
      priority: 0.7,
      changeFrequency: 'weekly' as const,
      lastModified: item.updated_at ? new Date(item.updated_at) : STATIC_LASTMOD,
    }))

  return [...staticRoutes, ...itemRoutes]
}
