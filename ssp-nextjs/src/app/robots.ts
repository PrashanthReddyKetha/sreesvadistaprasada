import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/checkout'],
    },
    sitemap: 'https://sreesvadistaprasada.com/sitemap.xml',
  }
}
