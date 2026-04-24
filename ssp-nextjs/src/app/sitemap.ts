import { MetadataRoute } from 'next'
import { BUSINESS } from '@/lib/business'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = BUSINESS.website
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/menu`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/dabba-wala`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/catering`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]
}
