import { MetadataRoute } from 'next'
import { BUSINESS } from '@/lib/business'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/_next/'] }],
    sitemap: `${BUSINESS.website}/sitemap.xml`,
    host: BUSINESS.website,
  }
}
