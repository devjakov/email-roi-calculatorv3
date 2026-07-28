import type { MetadataRoute } from 'next'

const SITE = 'https://www.marscopywriting.co'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Prospect-specific deliverable views are private links, not pages to index.
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
