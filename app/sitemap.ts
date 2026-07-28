import type { MetadataRoute } from 'next'

const SITE = 'https://www.marscopywriting.co'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/refund-cancellation`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
