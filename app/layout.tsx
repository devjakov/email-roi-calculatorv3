import type { Metadata } from 'next'
import './globals.css'
import { StructuredData } from './structured-data'
import { FAQS, CASE_STUDIES } from './content'

const SITE = 'https://www.marscopywriting.co'

// Kept close to the search-result budget: roughly 60 characters for the title
// and 155 for the description, before either gets truncated with an ellipsis.
const TITLE = "Mars Copywriting — $50K–$100K/Mo in Email Revenue or You Don't Pay"
const DESCRIPTION =
  "We'll add $50,000–$100,000 per month in new email revenue in 90 days or you don't pay. Done-for-you Klaviyo email for ecommerce brands doing $1M–$10M/year."
const OG_DESCRIPTION =
  "Done-for-you email system for ecommerce brands doing at least $1M-$10M/year. No race-to-the-bottom discount strategies. Maximize your existing traffic, no additional ad spend required, guaranteed results."

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    // Sub-pages set their own title and get the brand appended.
    template: '%s — Mars Copywriting',
  },
  description: DESCRIPTION,
  applicationName: 'Mars Copywriting',
  authors: [{ name: 'Jakov Maršić' }],
  creator: 'Mars Copywriting',
  publisher: 'Mars Copywriting j.d.o.o.',
  keywords: [
    'email marketing agency',
    'Klaviyo agency',
    'ecommerce email marketing',
    'email copywriting',
    'Klaviyo flows',
    'email marketing for Shopify',
    'DTC email marketing',
    'retention marketing',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: 'Mars Copywriting',
    title: TITLE,
    description: OG_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'Marketing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <StructuredData
          faqs={FAQS}
          caseStudies={CASE_STUDIES.map((cs) => ({
            brand: cs.brand,
            keyResult: cs.keyResult,
            summary: cs.headlineBig,
            href: cs.href,
          }))}
        />
        {children}
      </body>
    </html>
  )
}
