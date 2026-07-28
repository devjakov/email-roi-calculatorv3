/**
 * JSON-LD for the landing page.
 *
 * What this can and cannot do:
 *  - FAQPage is a supported rich result. The questions can appear expandable
 *    directly under the listing.
 *  - SiteNavigationElement describes the on-page sections. Google treats it as
 *    a hint, not an instruction: sitelinks are chosen algorithmically and
 *    cannot be forced by markup.
 *  - The case studies are modelled as an ItemList of CreativeWork so the
 *    results are machine-readable and eligible to be surfaced.
 *  - Client testimonials are deliberately NOT marked up as Review. Google
 *    disallows self-serving review markup on your own Organization, and using
 *    it risks a manual action rather than a richer listing.
 */

const SITE = 'https://www.marscopywriting.co'

export type FaqItem = { q: string; a: string }
export type CaseStudyItem = { brand: string; keyResult: string; summary: string; href: string }

export function StructuredData({ faqs, caseStudies }: { faqs: FaqItem[]; caseStudies: CaseStudyItem[] }) {
  const organization = {
    '@type': 'ProfessionalService',
    '@id': `${SITE}/#organization`,
    name: 'Mars Copywriting',
    legalName: 'Mars Copywriting j.d.o.o.',
    url: SITE,
    email: 'jacob@marscopywriting.com',
    description:
      'Done-for-you Klaviyo email marketing for ecommerce brands doing $1M-$10M per year. Campaign copywriting, flow automation, pop-up optimisation and deliverability management.',
    founder: { '@type': 'Person', name: 'Jakov Maršić' },
    foundingDate: '2024-01-30',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Topoljska ulica 15B',
      postalCode: '10255',
      addressLocality: 'Donji Stupnik',
      addressCountry: 'HR',
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Email marketing',
      'Klaviyo',
      'Ecommerce retention',
      'Email copywriting',
      'Marketing automation',
      'Email deliverability',
    ],
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Done-for-you email marketing',
        serviceType: 'Email marketing management',
        description:
          '12-18 campaigns per month plus 8-12 automated flows, built and managed end to end in Klaviyo or Omnisend.',
      },
    },
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: SITE,
    name: 'Mars Copywriting',
    publisher: { '@id': `${SITE}/#organization` },
    inLanguage: 'en',
  }

  // Mirrors the in-page anchors, so the section structure is explicit.
  const navigation = [
    { name: 'Results & Case Studies', url: `${SITE}/#results` },
    { name: 'Client Reviews', url: `${SITE}/#reviews` },
    { name: 'Is This For You', url: `${SITE}/#fit` },
    { name: 'What We Do', url: `${SITE}/#services` },
    { name: 'ROI Calculator', url: `${SITE}/#calculator` },
  ].map((item, i) => ({
    '@type': 'SiteNavigationElement',
    '@id': `${SITE}/#nav-${i}`,
    position: i + 1,
    name: item.name,
    url: item.url,
  }))

  const caseStudyList = {
    '@type': 'ItemList',
    '@id': `${SITE}/#case-studies`,
    name: 'Email marketing case studies',
    description: 'Documented revenue results from Mars Copywriting client engagements.',
    numberOfItems: caseStudies.length,
    itemListElement: caseStudies.map((cs, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: `${cs.brand}: ${cs.keyResult} in email revenue`,
        headline: `${cs.keyResult}${cs.summary}`,
        abstract: cs.summary.trim(),
        url: cs.href,
        about: { '@type': 'Organization', name: cs.brand },
        creator: { '@id': `${SITE}/#organization` },
        isPartOf: { '@id': `${SITE}/#website` },
      },
    })),
  }

  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${SITE}/#faq`,
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [organization, website, ...navigation, caseStudyList, faqPage],
  }

  return (
    <script
      type="application/ld+json"
      // Content is authored here, not user input; the escape guards against a
      // stray "</script>" ever appearing inside a case-study or FAQ string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }}
    />
  )
}
