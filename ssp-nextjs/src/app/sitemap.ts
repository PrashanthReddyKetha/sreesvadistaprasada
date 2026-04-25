import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.sreesvadistaprasada.com'
  const now = new Date()

  const routes = [
    { url: '/',               priority: 1.0,  changeFrequency: 'daily'   },
    { url: '/menu',           priority: 0.9,  changeFrequency: 'daily'   },
    { url: '/prasada',        priority: 0.9,  changeFrequency: 'daily'   },
    { url: '/svadista',       priority: 0.9,  changeFrequency: 'daily'   },
    { url: '/breakfast',      priority: 0.8,  changeFrequency: 'weekly'  },
    { url: '/street-food',    priority: 0.8,  changeFrequency: 'weekly'  },
    { url: '/ragi-specials',  priority: 0.8,  changeFrequency: 'weekly'  },
    { url: '/drinks',         priority: 0.7,  changeFrequency: 'weekly'  },
    { url: '/snacks',         priority: 0.8,  changeFrequency: 'weekly'  },
    { url: '/subscriptions',  priority: 0.9,  changeFrequency: 'weekly'  },
    { url: '/catering',       priority: 0.8,  changeFrequency: 'monthly' },
    { url: '/story',          priority: 0.6,  changeFrequency: 'monthly' },
    { url: '/gallery',        priority: 0.6,  changeFrequency: 'weekly'  },
    { url: '/contact',        priority: 0.7,  changeFrequency: 'monthly' },
    { url: '/faq',            priority: 0.7,  changeFrequency: 'monthly' },
    { url: '/privacy-policy', priority: 0.3,  changeFrequency: 'yearly'  },
    { url: '/terms',          priority: 0.3,  changeFrequency: 'yearly'  },
  ] as const

  return routes.map(({ url, priority, changeFrequency }) => ({
    url: `${base}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
