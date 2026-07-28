/**
 * Email Marketing ROI Calculator - Main Component
 * 
 * Purpose: Calculate email marketing ROI for ecommerce brands using real Klaviyo benchmark data
 * Built for: Mars Copywriting to demonstrate value to prospects
 * 
 * Key Features:
 * - Real Klaviyo benchmarks from 325B+ emails
 * - Traffic-based flow revenue calculation
 * - Campaign multiplier effect (more campaigns = more flow triggers)
 * - Linear scaling within revenue brackets
 * - Interactive performance charts
 * - Opportunity analysis with Mars Copywriting timeline
 */

'use client'

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { marked } from 'marked'

/**
 * INDUSTRY BENCHMARKS
 * 
 * Campaign RPR (Revenue Per Recipient) from Klaviyo's dataset
 * These represent average revenue generated per email sent for each industry
 * 
 * Flow RPR: Shown for reference but NOT used directly (we use AOV-based benchmarks instead)
 * 
 * Performance Tiers:
 * - typical: What 90% of brands do (underperforming)
 * - good: Solid performance (active brands)
 * - best: Top 1% performers (optimized programs)
 */
const INDUSTRY_BENCHMARKS = {
  'health-beauty': {
    name: 'Health & Beauty',
    campaignRPR: 0.074,
    flowRPR: 5.26,
    typical: { campaigns: 2, flows: 3 },
    good: { campaigns: 12, flows: 10 },
    best: { campaigns: 20, flows: 15 }
  },
  'food-beverage': {
    name: 'Food & Beverage',
    campaignRPR: 0.1,
    flowRPR: 4.2,
    typical: { campaigns: 2, flows: 3 },
    good: { campaigns: 15, flows: 10 },
    best: { campaigns: 25, flows: 15 }
  },
  'clothing-accessories': {
    name: 'Clothing & Accessories',
    campaignRPR: 0.065,
    flowRPR: 3.8,
    typical: { campaigns: 2, flows: 3 },
    good: { campaigns: 12, flows: 10 },
    best: { campaigns: 20, flows: 15 }
  },
  'electronics': {
    name: 'Electronics',
    campaignRPR: 0.09,
    flowRPR: 4.5,
    typical: { campaigns: 1, flows: 3 },
    good: { campaigns: 10, flows: 10 },
    best: { campaigns: 15, flows: 15 }
  },
  'home-garden': {
    name: 'Home & Garden',
    campaignRPR: 0.08,
    flowRPR: 4.0,
    typical: { campaigns: 2, flows: 3 },
    good: { campaigns: 12, flows: 10 },
    best: { campaigns: 18, flows: 15 }
  },
  'jewelry': {
    name: 'Jewelry',
    campaignRPR: 0.11,
    flowRPR: 5.5,
    typical: { campaigns: 2, flows: 3 },
    good: { campaigns: 10, flows: 10 },
    best: { campaigns: 15, flows: 15 }
  },
  'sporting-goods': {
    name: 'Sporting Goods',
    campaignRPR: 0.07,
    flowRPR: 3.5,
    typical: { campaigns: 2, flows: 3 },
    good: { campaigns: 12, flows: 10 },
    best: { campaigns: 20, flows: 15 }
  },
  'other': {
    name: 'E-commerce Other',
    campaignRPR: 0.08,
    flowRPR: 4.5,
    typical: { campaigns: 2, flows: 3 },
    good: { campaigns: 12, flows: 10 },
    best: { campaigns: 18, flows: 15 }
  }
}

/**
 * KLAVIYO PRICING TIERS
 * 
 * Official Klaviyo pricing as of 2025
 * Pricing is based on total profile count (email addresses in your account)
 * 
 * Used to calculate monthly Klaviyo cost in ROI calculations
 * 
 * Free tier: Up to 250 profiles
 * Max tier shown: 500k profiles at $4,900/month
 * For larger lists: Price scales proportionally
 */
const KLAVIYO_PRICING = [
  { profiles: 250, price: 0 },
  { profiles: 500, price: 20 },
  { profiles: 1000, price: 30 },
  { profiles: 2500, price: 60 },
  { profiles: 5000, price: 100 },
  { profiles: 10000, price: 150 },
  { profiles: 15000, price: 225 },
  { profiles: 20000, price: 280 },
  { profiles: 30000, price: 380 },
  { profiles: 40000, price: 470 },
  { profiles: 50000, price: 555 },
  { profiles: 75000, price: 810 },
  { profiles: 100000, price: 1050 },
  { profiles: 150000, price: 1600 },
  { profiles: 200000, price: 2050 },
  { profiles: 250000, price: 2500 },
  { profiles: 350000, price: 3500 },
  { profiles: 500000, price: 4900 }
]

/**
 * KLAVIYO FLOW BENCHMARKS
 * 
 * Official benchmarks from Klaviyo based on:
 * - Annual revenue bracket ($0-1M, $1M-5M, $5M-20M)
 * - Average Order Value (AOV) ranges
 * - Flow type (Abandoned Cart, Welcome Series, Post-Purchase)
 * 
 * Source: https://help.klaviyo.com/hc/en-us/articles/115005084927
 * 
 * Data structure:
 * - rpr25: 25th percentile (bottom performers in bracket)
 * - rpr75: 75th percentile (top performers in bracket)
 * 
 * How we use this:
 * 1. Determine which revenue bracket the business is in
 * 2. Find their position within that bracket (0-100%)
 * 3. Find matching AOV range
 * 4. Scale RPR linearly from rpr25 to rpr75 based on position
 * 
 * Example: $3M annual revenue in $1M-5M bracket = 50% through bracket
 * RPR = rpr25 + (0.50 × (rpr75 - rpr25))
 */
const FLOW_BENCHMARKS = {
  // $0-1M annual revenue bracket
  '0-1m': {
    abandonedCart: [
      { aovMin: 0, aovMax: 28, rpr25: 0.13, rpr75: 0.81 },
      { aovMin: 28, aovMax: 37, rpr25: 0.34, rpr75: 1.28 },
      { aovMin: 37, aovMax: 44, rpr25: 0.49, rpr75: 1.62 },
      { aovMin: 44, aovMax: 83, rpr25: 0.86, rpr75: 2.91 },
      { aovMin: 83, aovMax: 112, rpr25: 1.76, rpr75: 5.32 },
      { aovMin: 112, aovMax: 163, rpr25: 2.69, rpr75: 8.90 },
      { aovMin: 163, aovMax: 291, rpr25: 4.30, rpr75: 13.75 },
      { aovMin: 291, aovMax: Infinity, rpr25: 7.77, rpr75: 43.51 }
    ],
    welcome: [
      { aovMin: 0, aovMax: 28, rpr25: 0.03, rpr75: 0.56 },
      { aovMin: 28, aovMax: 37, rpr25: 0.07, rpr75: 1.03 },
      { aovMin: 37, aovMax: 44, rpr25: 0.09, rpr75: 1.25 },
      { aovMin: 44, aovMax: 83, rpr25: 0.17, rpr75: 1.95 },
      { aovMin: 83, aovMax: 112, rpr25: 0.44, rpr75: 3.60 },
      { aovMin: 112, aovMax: 163, rpr25: 0.48, rpr75: 5.10 },
      { aovMin: 163, aovMax: 291, rpr25: 0.47, rpr75: 6.97 },
      { aovMin: 291, aovMax: Infinity, rpr25: 0.32, rpr75: 11.50 }
    ],
    postPurchase: [
      { aovMin: 0, aovMax: 28, rpr25: 0.00, rpr75: 0.16 },
      { aovMin: 28, aovMax: 37, rpr25: 0.02, rpr75: 0.20 },
      { aovMin: 37, aovMax: 44, rpr25: 0.03, rpr75: 0.27 },
      { aovMin: 44, aovMax: 83, rpr25: 0.05, rpr75: 0.44 },
      { aovMin: 83, aovMax: 112, rpr25: 0.13, rpr75: 0.97 },
      { aovMin: 112, aovMax: 163, rpr25: 0.20, rpr75: 1.39 },
      { aovMin: 163, aovMax: 291, rpr25: 0.09, rpr75: 1.92 },
      { aovMin: 291, aovMax: Infinity, rpr25: 0.05, rpr75: 7.24 }
    ]
  },
  // $1M-5M annual revenue
  '1m-5m': {
    abandonedCart: [
      { aovMin: 0, aovMax: 28, rpr25: 0.20, rpr75: 0.73 },
      { aovMin: 28, aovMax: 37, rpr25: 0.30, rpr75: 1.13 },
      { aovMin: 37, aovMax: 44, rpr25: 0.71, rpr75: 1.68 },
      { aovMin: 44, aovMax: 83, rpr25: 1.12, rpr75: 3.03 },
      { aovMin: 83, aovMax: 112, rpr25: 2.39, rpr75: 5.86 },
      { aovMin: 112, aovMax: 163, rpr25: 3.86, rpr75: 8.63 },
      { aovMin: 163, aovMax: 291, rpr25: 6.00, rpr75: 16.40 },
      { aovMin: 291, aovMax: Infinity, rpr25: 13.97, rpr75: 60.48 }
    ],
    welcome: [
      { aovMin: 0, aovMax: 28, rpr25: 0.06, rpr75: 0.57 },
      { aovMin: 28, aovMax: 37, rpr25: 0.15, rpr75: 1.31 },
      { aovMin: 37, aovMax: 44, rpr25: 0.29, rpr75: 1.73 },
      { aovMin: 44, aovMax: 83, rpr25: 0.35, rpr75: 2.53 },
      { aovMin: 83, aovMax: 112, rpr25: 0.51, rpr75: 3.93 },
      { aovMin: 112, aovMax: 163, rpr25: 1.15, rpr75: 8.39 },
      { aovMin: 163, aovMax: 291, rpr25: 1.20, rpr75: 8.44 },
      { aovMin: 291, aovMax: Infinity, rpr25: 1.47, rpr75: 15.72 }
    ],
    postPurchase: [
      { aovMin: 0, aovMax: 28, rpr25: 0.03, rpr75: 0.10 },
      { aovMin: 28, aovMax: 37, rpr25: 0.05, rpr75: 0.18 },
      { aovMin: 37, aovMax: 44, rpr25: 0.06, rpr75: 0.23 },
      { aovMin: 44, aovMax: 83, rpr25: 0.11, rpr75: 0.44 },
      { aovMin: 83, aovMax: 112, rpr25: 0.24, rpr75: 0.72 },
      { aovMin: 112, aovMax: 163, rpr25: 0.29, rpr75: 1.30 },
      { aovMin: 163, aovMax: 291, rpr25: 0.38, rpr75: 1.73 },
      { aovMin: 291, aovMax: Infinity, rpr25: 1.27, rpr75: 7.58 }
    ]
  },
  // $5M-20M annual revenue
  '5m-20m': {
    abandonedCart: [
      { aovMin: 44, aovMax: 83, rpr25: 1.30, rpr75: 2.88 },
      { aovMin: 83, aovMax: 112, rpr25: 3.03, rpr75: 5.07 },
      { aovMin: 112, aovMax: 163, rpr25: 4.52, rpr75: 8.13 },
      { aovMin: 163, aovMax: 291, rpr25: 6.00, rpr75: 13.58 },
      { aovMin: 291, aovMax: Infinity, rpr25: 15.74, rpr75: 51.07 }
    ],
    welcome: [
      { aovMin: 44, aovMax: 83, rpr25: 0.60, rpr75: 2.19 },
      { aovMin: 83, aovMax: 112, rpr25: 0.94, rpr75: 4.55 },
      { aovMin: 112, aovMax: 163, rpr25: 1.94, rpr75: 6.23 },
      { aovMin: 163, aovMax: 291, rpr25: 1.58, rpr75: 10.40 },
      { aovMin: 291, aovMax: Infinity, rpr25: 1.80, rpr75: 11.23 }
    ],
    postPurchase: [
      { aovMin: 44, aovMax: 83, rpr25: 0.18, rpr75: 0.45 },
      { aovMin: 83, aovMax: 112, rpr25: 0.28, rpr75: 0.85 },
      { aovMin: 163, aovMax: 291, rpr25: 0.54, rpr75: 2.03 },
      { aovMin: 291, aovMax: Infinity, rpr25: 1.01, rpr75: 6.77 }
    ]
  }
}

/**
 * GET FLOW RPR - Core calculation function
 * 
 * Purpose: Get the correct flow RPR benchmarks and scale them based on business performance
 * 
 * How it works:
 * 1. Determines which revenue bracket you're in ($0-1M, $1M-5M, or $5M-20M)
 * 2. Calculates your position within that bracket (0% to 100%)
 *    - 0% = just entered bracket (use 25th percentile RPR)
 *    - 50% = middle of bracket (use median RPR)
 *    - 100% = top of bracket (use 75th percentile RPR)
 * 3. Finds the AOV range that matches your average order value
 * 4. Linearly scales RPR from rpr25 to rpr75 based on position
 * 5. Returns individual RPR values for each flow type
 * 
 * Why this matters:
 * - A $10/month business gets low RPR (just starting out)
 * - A $500k/month business gets high RPR (established & optimized)
 * - Bigger businesses have better email programs = higher RPR
 * 
 * @param annualRevenue - Total annual business revenue (not just email)
 * @param aov - Average order value ($)
 * @returns Object with RPR values for each flow type
 */
function getFlowRPR(annualRevenue: number, aov: number): { abandonedCart: number, welcome: number, postPurchase: number, browseAbandonment: number } {
  // Step 1: Determine revenue bracket and calculate position within it (0.0 to 1.0)
  // Step 1: Determine revenue bracket and calculate position within it (0.0 to 1.0)
  let bracket: '0-1m' | '1m-5m' | '5m-20m'
  let bracketPosition = 0
  
  if (annualRevenue < 1000000) {
    bracket = '0-1m'
    // Example: $500k annual = 50% through $0-1M bracket
    bracketPosition = annualRevenue / 1000000
  } else if (annualRevenue < 5000000) {
    bracket = '1m-5m'
    // Example: $3M annual = ($3M - $1M) / $4M = 50% through bracket
    bracketPosition = (annualRevenue - 1000000) / 4000000
  } else {
    bracket = '5m-20m'
    // Example: $12M annual = ($12M - $5M) / $15M = 46% through bracket
    // Cap at 100% for revenues above $20M
    bracketPosition = Math.min((annualRevenue - 5000000) / 15000000, 1.0)
  }
  
  // Step 2: Get benchmarks for this revenue bracket
  const benchmarks = FLOW_BENCHMARKS[bracket]
  
  // Step 3: Find matching AOV range and scale RPR based on bracket position
  /**
   * This function finds the correct AOV range and scales the RPR
   * 
   * Scaling formula: rpr25 + (position × (rpr75 - rpr25))
   * 
   * Example with AOV $95 in $1M-5M bracket at 50% position:
   * - Abandoned Cart: rpr25=$2.39, rpr75=$5.86
   * - Scaled RPR = $2.39 + (0.50 × ($5.86 - $2.39)) = $4.13
   */
  const findRPR = (flowData: any[]) => {
    // Find the AOV range that matches (e.g., AOV $95 matches $83-$112 range)
    const match = flowData.find(range => aov >= range.aovMin && aov < range.aovMax)
    if (!match) return 0
    
    // Scale linearly from 25th percentile (bottom) to 75th percentile (top)
    // based on how far through the revenue bracket you are
    return match.rpr25 + (bracketPosition * (match.rpr75 - match.rpr25))
  }
  
  return {
    abandonedCart: findRPR(benchmarks.abandonedCart),
    welcome: findRPR(benchmarks.welcome),
    postPurchase: findRPR(benchmarks.postPurchase),
    // Browse abandonment estimated at 30% of abandoned cart RPR (no official Klaviyo data)
    browseAbandonment: findRPR(benchmarks.abandonedCart) * 0.3
  }
}

/**
 * GET KLAVIYO PRICE
 * 
 * Calculates monthly Klaviyo cost based on profile count
 * Uses official 2025 Klaviyo pricing tiers
 * 
 * Logic:
 * - Finds the first pricing tier that matches or exceeds profile count
 * - For profiles above max tier (500k), extrapolates price linearly
 * 
 * @param profiles - Total number of email profiles in Klaviyo
 * @returns Monthly Klaviyo cost in dollars
 */
function getKlaviyoPrice(profiles: number): number {
  // Find matching tier
  for (let i = 0; i < KLAVIYO_PRICING.length; i++) {
    if (profiles <= KLAVIYO_PRICING[i].profiles) {
      return KLAVIYO_PRICING[i].price
    }
  }
  // If above max tier, calculate proportionally
  const lastTier = KLAVIYO_PRICING[KLAVIYO_PRICING.length - 1]
  const pricePerProfile = lastTier.price / lastTier.profiles
  return Math.round(profiles * pricePerProfile)
}

/**
 * LAST-TOUCH ATTRIBUTION CORRECTION
 *
 * Klaviyo uses last-touch attribution, meaning any purchase where the customer
 * clicked an email within the attribution window is credited to email - even if
 * the customer would have purchased anyway (e.g., via a welcome flow).
 *
 * Industry estimate: ~20% of Klaviyo-reported email revenue is "would have happened
 * anyway" revenue. Removing it gives a more honest picture of email's true lift.
 *
 * Impact on the dashboard:
 *   - incrementalEmailRevenue = totalEmailRevenue × 80%  (truly new revenue)
 *   - trueNewTotalRevenue     = businessRevenue + incrementalEmailRevenue
 *   - emailAttributedPercent  = incrementalEmailRevenue / trueNewTotalRevenue
 *
 * Example: $400k business + $400k Klaviyo email revenue
 *   → incrementalEmailRevenue = $320k
 *   → trueNewTotalRevenue     = $720k   (not $800k)
 *   → emailAttributedPercent  = 44.4%  (not 99.1%)
 */
const LAST_TOUCH_OVERLAP_RATE = 0.20

// ==================== DELIVERABLES TYPES ====================

interface ProspectData {
  prospect: string
  campaigns_markdown: string
  flows_markdown: string
  sheet_row: number
}

/** Split a markdown blob into named sections on ## headings */
function splitMarkdownSections(md: string): Array<{ title: string; content: string }> {
  if (!md.trim()) return []
  // Split on lines that start with ## (section headers)
  const parts = md.split(/\n(?=##\s)/)
  return parts.map(part => {
    const firstLine = part.match(/^##\s+(.+)/m)
    const title = firstLine ? firstLine[1].trim() : part.slice(0, 60).trim()
    // Remove the ## header line from content so it isn't doubled
    const content = firstLine ? part.replace(/^##\s+.+\n?/, '').trim() : part.trim()
    return { title, content }
  }).filter(s => s.title || s.content)
}

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true })

/**
 * Render markdown as email-styled HTML.
 * Center-aligned, big font, CTAs in [brackets] become blue buttons.
 */
function renderEmailHtml(md: string): string {
  if (!md.trim()) return ''
  let html = marked.parse(md) as string

  // Standalone CTA paragraph: <p>[Shop Now - $48]</p> → blue button
  html = html.replace(
    /<p>\[([^\]]+)\]<\/p>/g,
    '<p style="text-align:center;margin:1.5rem 0">' +
    '<span style="display:inline-block;padding:0.75rem 2.25rem;background:#2563eb;color:#fff;font-weight:700;border-radius:0.5rem;font-size:1rem;letter-spacing:0.01em">$1</span>' +
    '</p>'
  )
  // Remaining <p> tags
  html = html.replace(/<p>/g, '<p style="font-size:1rem;line-height:1.8;color:#1f2937;margin:1rem 0;text-align:center">')
  // Headings
  html = html
    .replace(/<h1>/g, '<h1 style="font-size:2rem;font-weight:800;color:#111827;margin:1.75rem 0 0.75rem;text-align:center">')
    .replace(/<h2>/g, '<h2 style="font-size:1.6rem;font-weight:700;color:#111827;margin:1.5rem 0 0.5rem;text-align:center">')
    .replace(/<h3>/g, '<h3 style="font-size:1.1rem;font-weight:700;color:#1f2937;margin:1.25rem 0 0.5rem;text-align:center">')
    .replace(/<h4>/g, '<h4 style="font-size:1rem;font-weight:700;color:#374151;margin:1rem 0 0.25rem;text-align:center">')
  // HR, strong
  html = html
    .replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:1.75rem 0">')
    .replace(/<strong>/g, '<strong style="font-weight:700;color:#111827">')
  // Remaining inline [brackets] → bold blue
  html = html.replace(/\[([^\]<>]+)\]/g, '<strong style="color:#2563eb;font-weight:700">[$1]</strong>')
  // Lists (display:inline-block so they stay centred in the container)
  html = html
    .replace(/<ul>/g, '<ul style="list-style:disc;padding-left:1.5rem;margin:0.75rem auto;display:inline-block;text-align:left">')
    .replace(/<ol>/g, '<ol style="list-style:decimal;padding-left:1.5rem;margin:0.75rem auto;display:inline-block;text-align:left">')
    .replace(/<li>/g, '<li style="margin:0.4rem 0;font-size:1rem;color:#1f2937">')
  return html
}

/**
 * Render markdown as flow/automation-styled HTML.
 * Left-aligned, document-like for step-by-step sequences.
 */
function renderFlowHtml(md: string): string {
  if (!md.trim()) return ''
  let html = marked.parse(md) as string
  html = html
    .replace(/<p>/g, '<p style="font-size:1rem;line-height:1.75;color:#1f2937;margin:0.875rem 0">')
    .replace(/<h1>/g, '<h1 style="font-size:1.4rem;font-weight:800;color:#111827;margin:1.5rem 0 0.5rem">')
    .replace(/<h2>/g, '<h2 style="font-size:1.2rem;font-weight:700;color:#111827;margin:1.25rem 0 0.5rem">')
    .replace(/<h3>/g, '<h3 style="font-size:1.05rem;font-weight:700;color:#1f2937;margin:1rem 0 0.4rem">')
    .replace(/<h4>/g, '<h4 style="font-size:1rem;font-weight:700;color:#374151;margin:0.75rem 0 0.25rem">')
    .replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0">')
    .replace(/<strong>/g, '<strong style="font-weight:700;color:#111827">')
    .replace(/<ul>/g, '<ul style="list-style:disc;padding-left:1.5rem;margin:0.75rem 0">')
    .replace(/<ol>/g, '<ol style="list-style:decimal;padding-left:1.5rem;margin:0.75rem 0">')
    .replace(/<li>/g, '<li style="margin:0.4rem 0;font-size:1rem;color:#1f2937">')
  return html
}

type LightboxState = { items: string[]; basePath: string; index: number; alt: string }

function SocialProofCarousels() {
  const [images, setImages] = useState<{ klaviyo: string[]; slack: string[] }>({ klaviyo: [], slack: [] })
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  useEffect(() => {
    fetch('/images/proof/manifest.json')
      .then(res => res.json())
      .then(setImages)
      .catch(() => {})
  }, [])

  if (!images.klaviyo.length && !images.slack.length) return null

  return (
    <div className="mb-14 space-y-12">
      <MosaicMarquee
        items={images.klaviyo}
        folder="klaviyo"
        label="Results"
        direction="left"
        alt="Klaviyo results"
        onOpen={(index) => setLightbox({ items: images.klaviyo, basePath: '/images/proof/klaviyo', index, alt: 'Klaviyo results' })}
      />
      <MosaicMarquee
        items={images.slack}
        folder="slack"
        label="What Clients Say"
        direction="right"
        alt="Client feedback"
        onOpen={(index) => setLightbox({ items: images.slack, basePath: '/images/proof/slack', index, alt: 'Client feedback' })}
      />
      {lightbox && (
        <Lightbox
          {...lightbox}
          onClose={() => setLightbox(null)}
          onIndex={(index) => setLightbox(prev => (prev ? { ...prev, index } : prev))}
        />
      )}
    </div>
  )
}

function MosaicMarquee({
  items,
  folder,
  label,
  direction,
  alt,
  onOpen,
}: {
  items: string[]
  folder: string
  label: string
  direction: 'left' | 'right'
  alt: string
  onOpen: (index: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const distanceRef = useRef(0)
  const speedRef = useRef(0)
  const targetRef = useRef(0)
  const draggingRef = useRef(false)
  const inertiaRef = useRef(0)
  const suppressClickRef = useRef(false)

  const BASE_SPEED = 40 // px/sec at rest
  const HOVER_SPEED = 10 // px/sec while hovered (slows, never stops)

  useEffect(() => {
    if (!items.length) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dirSign = direction === 'left' ? 1 : -1
    targetRef.current = reduce ? 0 : BASE_SPEED
    speedRef.current = reduce ? 0 : BASE_SPEED

    const panel = panelRef.current
    const viewport = viewportRef.current
    const measure = () => {
      if (!panel) return
      const parent = panel.parentElement
      const gap = parent ? parseFloat(getComputedStyle(parent).columnGap || '0') || 0 : 0
      distanceRef.current = panel.offsetWidth + gap
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (panel) ro.observe(panel)

    // Offset is wrapped into [0, d) so the two identical panels loop seamlessly
    // no matter how far a drag or a wheel throw pushes it.
    const wrap = (v: number) => {
      const d = distanceRef.current
      return d > 0 ? ((v % d) + d) % d : v
    }
    const draw = () => {
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const auto = draggingRef.current ? 0 : speedRef.current
      speedRef.current += ((draggingRef.current ? 0 : targetRef.current) - speedRef.current) * Math.min(dt * 6, 1)
      if (distanceRef.current > 0) {
        offsetRef.current = wrap(offsetRef.current + dirSign * auto * dt + inertiaRef.current * dt)
        draw()
      }
      // Exponential decay: ~99.8% of the throw is spent after one second.
      if (inertiaRef.current) {
        inertiaRef.current *= Math.pow(0.002, dt)
        if (Math.abs(inertiaRef.current) < 2) inertiaRef.current = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Wheel. Trackpad horizontal swipes report deltaX; a plain wheel reports
    // deltaY, and we scrub with whichever axis the gesture leans on.
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!delta) return
      e.preventDefault()
      inertiaRef.current = 0
      offsetRef.current = wrap(offsetRef.current + delta)
      draw()
    }

    // Pointer drag covers mouse and touch alike. touch-action: pan-y on the
    // viewport keeps vertical page scrolling with the browser, so only the
    // horizontal component ever reaches us.
    let lastX = 0
    let lastT = 0
    let travelled = 0
    let velocity = 0
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      draggingRef.current = true
      suppressClickRef.current = false
      inertiaRef.current = 0
      travelled = 0
      lastX = e.clientX
      lastT = performance.now()
      viewport?.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      const dx = e.clientX - lastX
      if (!dx) return
      const now = performance.now()
      const dt = Math.max((now - lastT) / 1000, 1 / 240)
      lastX = e.clientX
      lastT = now
      travelled += Math.abs(dx)
      if (travelled > 5) suppressClickRef.current = true
      inertiaRef.current = 0
      offsetRef.current = wrap(offsetRef.current - dx)
      draw()
      // Keep the last frame's velocity so release can throw the track.
      velocity = -dx / dt
    }
    const endDrag = (e: PointerEvent) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      if (viewport?.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId)
      inertiaRef.current = Math.max(-2600, Math.min(2600, velocity))
      velocity = 0
    }

    // A drag that ends on a tile must not also open the lightbox.
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClickRef.current) return
      suppressClickRef.current = false
      e.preventDefault()
      e.stopPropagation()
    }

    viewport?.addEventListener('wheel', onWheel, { passive: false })
    viewport?.addEventListener('pointerdown', onPointerDown)
    viewport?.addEventListener('pointermove', onPointerMove)
    viewport?.addEventListener('pointerup', endDrag)
    viewport?.addEventListener('pointercancel', endDrag)
    viewport?.addEventListener('click', onClickCapture, true)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      viewport?.removeEventListener('wheel', onWheel)
      viewport?.removeEventListener('pointerdown', onPointerDown)
      viewport?.removeEventListener('pointermove', onPointerMove)
      viewport?.removeEventListener('pointerup', endDrag)
      viewport?.removeEventListener('pointercancel', endDrag)
      viewport?.removeEventListener('click', onClickCapture, true)
    }
  }, [direction, items.length])

  if (!items.length) return null

  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const slow = () => { if (!reduce) targetRef.current = HOVER_SPEED }
  const resume = () => { if (!reduce) targetRef.current = BASE_SPEED }

  const renderPanel = (keyPrefix: string, ariaHidden: boolean) => (
    <div ref={ariaHidden ? undefined : panelRef} className="mosaic-panel" aria-hidden={ariaHidden}>
      {items.map((img, i) => (
        <button
          key={`${keyPrefix}-${i}`}
          type="button"
          className="mosaic-tile"
          onClick={() => onOpen(i)}
          aria-label={`${alt}, view ${i + 1} of ${items.length}`}
          tabIndex={ariaHidden ? -1 : 0}
        >
          <img src={`/images/proof/${folder}/${encodeURIComponent(img)}`} alt={alt} loading="lazy" decoding="async" />
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <p className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">{label}</p>
      <div
        ref={viewportRef}
        className="overflow-hidden carousel-mask mosaic-viewport"
        onMouseEnter={slow}
        onMouseLeave={resume}
      >
        <div ref={trackRef} className="mosaic-track">
          {renderPanel('a', false)}
          {renderPanel('b', true)}
        </div>
      </div>
    </div>
  )
}

function Lightbox({
  items,
  basePath,
  index,
  alt,
  onClose,
  onIndex,
}: LightboxState & { onClose: () => void; onIndex: (index: number) => void }) {
  const go = useCallback((delta: number) => {
    onIndex((index + delta + items.length) % items.length)
  }, [index, items.length, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [go, onClose])

  return (
    <div className="lightbox-backdrop" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button className="lightbox-btn lightbox-close" onClick={onClose} aria-label="Close">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
      {items.length > 1 && (
        <button className="lightbox-btn lightbox-arrow lightbox-prev" onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="Previous">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      )}
      <img
        className="lightbox-img"
        src={`${basePath}/${encodeURIComponent(items[index])}`}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
      />
      {items.length > 1 && (
        <button className="lightbox-btn lightbox-arrow lightbox-next" onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="Next">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      )}
      <div className="lightbox-count">{index + 1} / {items.length}</div>
    </div>
  )
}

// Trusted-by logo strip fed by a single flat manifest folder. Shows brand logos when
// present, otherwise placeholder logo tiles.
function TrustedByLogos({ images }: { images: string[] }) {
  if (!images.length) return null
  return (
    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-9 gap-y-4">
      {images.map((img, i) => {
        // Logos with a baked solid background can't be normalized to a white silhouette,
        // so they sit on a light chip instead.
        const chip = /cerberus/i.test(img)
        return (
          <img
            key={i}
            className={chip ? 'tb-logo tb-logo--chip' : 'tb-logo'}
            src={`/images/trusted-by/${encodeURIComponent(img)}`}
            alt="Brand logo"
            loading="lazy"
            decoding="async"
          />
        )
      })}
    </div>
  )
}

// Round avatar fed by a manifest folder. Shows the first image if present, otherwise
// a placeholder with the person's initials.
function Avatar({ basePath, image, name }: { basePath: string; image?: string; name: string }) {
  if (image) {
    return <img className="kw-avatar" src={`${basePath}/${encodeURIComponent(image)}`} alt={name} loading="lazy" decoding="async" />
  }
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div className="kw-avatar kw-avatar-ph" aria-hidden>{initials}</div>
}

// Static image mosaic fed by a manifest folder. Renders clickable tiles (opening the
// shared Lightbox). Renders nothing until the folder has images.
function ProofMosaic({
  basePath,
  images,
  alt,
  label,
  size = 'md',
}: {
  basePath: string
  images: string[]
  alt: string
  label?: string
  size?: 'sm' | 'md'
}) {
  const [index, setIndex] = useState<number | null>(null)
  if (!images.length) return null
  const gridClass = `pm-grid${size === 'sm' ? ' pm-grid-sm' : ''}`

  return (
    <div className={size === 'sm' ? 'mt-5' : 'mt-7'}>
      {label && <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{label}</div>}
      <div className={gridClass}>
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className="pm-tile"
            onClick={() => setIndex(i)}
            aria-label={`${alt}, image ${i + 1} of ${images.length}`}
          >
            <img src={`${basePath}/${encodeURIComponent(img)}`} alt={alt} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      {index !== null && (
        <Lightbox
          items={images}
          basePath={basePath}
          index={index}
          alt={alt}
          onClose={() => setIndex(null)}
          onIndex={setIndex}
        />
      )}
    </div>
  )
}

/* Numbered input stage inside the ROI calculator. Label rail on the left,
   controls on the right; collapses to a single column below lg. */
function CalcStep({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)] gap-x-10 gap-y-6 py-10 first:pt-0 last:pb-0 border-t border-white/[0.08] first:border-t-0">
      <div className="flex items-baseline gap-4 lg:block">
        <div className="text-2xl font-extrabold tabular-nums text-purple-500/40 leading-none lg:mb-3">{n}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

/* Range control: name on the left, live value on the right, bounds underneath. */
function CalcSlider({ label, display, value, min, max, step = 1, minLabel, maxLabel, onChange }: {
  label: string
  display: string
  value: number
  min: number
  max: number
  step?: number
  minLabel: string
  maxLabel: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2.5">
        <label className="text-sm text-gray-400">{label}</label>
        <span className="text-sm font-semibold text-white tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
      />
      <div className="flex justify-between text-[0.6875rem] text-gray-600 mt-2 tabular-nums">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
      <Home />
    </Suspense>
  )
}

function Home() {
  // ==================== URL PARAMS & PROSPECT MODE ====================
  const searchParams = useSearchParams()
  const router = useRouter()
  const prospectSlug = searchParams.get('prospect')
  const isEditMode = searchParams.get('edit') === 'true'
  const editKey = searchParams.get('key') ?? ''

  // Active section is derived from ?view=roi URL param so browser back works
  const activeSection = searchParams.get('view') === 'roi' ? 'calculator' : 'deliverables'
  const setActiveSection = (section: 'deliverables' | 'calculator') => {
    const params = new URLSearchParams(searchParams.toString())
    if (section === 'calculator') {
      params.set('view', 'roi')
    } else {
      params.delete('view')
    }
    router.push(`?${params.toString()}`)
  }

  // Prospect data state
  const [prospectData, setProspectData] = useState<ProspectData | null>(null)
  const [prospectLoading, setProspectLoading] = useState(false)
  const [prospectError, setProspectError] = useState<string | null>(null)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<number>>(new Set())
  const [expandedFlows, setExpandedFlows] = useState<Set<number>>(new Set())
  const [savingField, setSavingField] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Fetch prospect data when slug changes
  useEffect(() => {
    if (!prospectSlug) return
    setProspectLoading(true)
    setProspectError(null)
    fetch(`/api/prospect?name=${encodeURIComponent(prospectSlug)}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? 'Failed to load deliverables')
        const d = data as ProspectData
        setProspectData(d)
        // Auto-expand all cards on load
        const campCount = splitMarkdownSections(d.campaigns_markdown).length
        const flowCount = splitMarkdownSections(d.flows_markdown).length
        setExpandedCampaigns(new Set(Array.from({ length: campCount }, (_, i) => i)))
        setExpandedFlows(new Set(Array.from({ length: flowCount }, (_, i) => i)))
        setProspectLoading(false)
      })
      .catch(err => {
        setProspectError(err.message)
        setProspectLoading(false)
      })
  }, [prospectSlug])

  // Scroll-reveal: fade elements up as they enter the viewport (skipped for reduced-motion)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.documentElement.classList.add('reveal-on')
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (!els.length) return
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    els.forEach(el => io.observe(el))
    return () => { io.disconnect(); document.documentElement.classList.remove('reveal-on') }
  }, [prospectSlug])

  // Case study / brand result images, sourced from manifests (same pattern as the carousels)
  const [caseImages, setCaseImages] = useState<Record<string, string[]>>({})
  const [brandImages, setBrandImages] = useState<Record<string, string[]>>({})
  const [testimonialImages, setTestimonialImages] = useState<Record<string, string[]>>({})
  const [trustedImages, setTrustedImages] = useState<string[]>([])
  useEffect(() => {
    fetch('/images/case-studies/manifest.json').then(r => r.json()).then(setCaseImages).catch(() => {})
    fetch('/images/brand-results/manifest.json').then(r => r.json()).then(setBrandImages).catch(() => {})
    fetch('/images/testimonials/manifest.json').then(r => r.json()).then(setTestimonialImages).catch(() => {})
    fetch('/images/trusted-by/manifest.json').then(r => r.json()).then(setTrustedImages).catch(() => {})
  }, [])

  const prospectName = prospectSlug
    ? prospectSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : ''

  const toggleCampaign = useCallback((n: number) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }, [])

  const toggleFlow = useCallback((n: number) => {
    setExpandedFlows(prev => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }, [])

  // Save campaigns_markdown or flows_markdown back to Google Sheets
  const saveField = useCallback(async (field: 'campaigns' | 'flows', value: string) => {
    if (!prospectData) return
    setSavingField(field)
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: editKey, sheet_row: prospectData.sheet_row, field, value }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Save failed: ${data.error || 'Unknown error'}`)
      } else {
        // Update local state so UI reflects the change immediately
        setProspectData(prev => prev ? { ...prev, [`${field}_markdown`]: value } : prev)
      }
    } catch {
      alert('Save failed: network error')
    } finally {
      setSavingField(null)
    }
  }, [editKey, prospectData])

  // ==================== STATE MANAGEMENT ====================

  // Industry selection (determines campaign RPR baseline)
  const [selectedIndustry, setSelectedIndustry] = useState<keyof typeof INDUSTRY_BENCHMARKS>('health-beauty')
  
  // Email list configuration
  const [emailListSize, setEmailListSize] = useState(150000) // Total profiles in Klaviyo
  const [campaignsPerMonth, setCampaignsPerMonth] = useState(8) // Email campaigns sent per month
  const [numberOfFlows, setNumberOfFlows] = useState(15) // Active automated flows
  
  // Business metrics
  const [monthlyRetainer, setMonthlyRetainer] = useState(5000) // Mars Copywriting fee
  const [grossMargin, setGrossMargin] = useState(50) // Profit margin % (for net ROI calculation)
  const [totalMonthlyRevenue, setTotalMonthlyRevenue] = useState(1280000) // Total business revenue
  const [averageOrderValue, setAverageOrderValue] = useState(95) // AOV (determines flow RPR benchmarks)
  
  // Traffic-based calculator (NEW: Flow revenue = new subscribers × RPR)
  const [monthlyTraffic, setMonthlyTraffic] = useState(300000) // Monthly website visitors
  const [popupConversionRate, setPopupConversionRate] = useState(2.5) // Pop-up conversion % (1-20%)
  
  // Manual campaign override (optional - allows user to input actual campaign revenue)
  const [useManualCampaignRev, setUseManualCampaignRev] = useState(false)
  const [manualAvgCampaignRev, setManualAvgCampaignRev] = useState(0)
  const [useManualFlowRPR, setUseManualFlowRPR] = useState(false)
  const [manualFlowRPR, setManualFlowRPR] = useState(0)
  
  // ==================== DERIVED VALUES ====================
  
  /**
   * ENGAGED LIST SIZE
   * Only 30-40% of an email list is typically "engaged" (opened in last 90-240 days)
   * We use 40% as the engaged segment for all revenue calculations
   * This is the "true" list size that actually receives and opens emails
   */
  const engagedListSize = Math.round(emailListSize * 0.4)

  // Get industry benchmarks and Klaviyo pricing
  const industry = INDUSTRY_BENCHMARKS[selectedIndustry]
  const klaviyoCost = getKlaviyoPrice(emailListSize)

  // Calculate annual revenue (used for bracket determination) and get flow RPR benchmarks
  const annualRevenue = totalMonthlyRevenue * 12
  const flowRPRBenchmarks = getFlowRPR(annualRevenue, averageOrderValue)

  /**
   * TRAFFIC TO SUBSCRIBERS CONVERSION
   * Key insight: Flow revenue comes from NEW SUBSCRIBERS entering flows
   * Formula: Monthly Traffic × Pop-up Conversion Rate = New Subscribers per Month
   */
  const newSubscribersPerMonth = Math.round(monthlyTraffic * (popupConversionRate / 100))

  /**
   * ==================== MAIN CALCULATIONS ====================
   * 
   * This is the heart of the calculator where all revenue and ROI metrics are computed
   * Uses React's useMemo for performance (only recalculates when dependencies change)
   */
  const calculations = useMemo(() => {
    /**
     * CAMPAIGN MULTIPLIER
     * 
     * More campaigns = more email engagement = more people re-triggering flows
     * Formula: 1 + (campaigns × 0.015), capped at 1.25 (25% max boost)
     * 
     * Examples:
     * - 5 campaigns = 1.075x multiplier (7.5% boost)
     * - 10 campaigns = 1.15x multiplier (15% boost)
     * - 15 campaigns = 1.225x multiplier (22.5% boost)
     * - 17+ campaigns = 1.25x multiplier (25% boost - capped)
     * 
     * Why: More campaigns → More clicks → More cart abandons, browses, purchases → More flow triggers
     */
    const campaignMultiplier = Math.min(1 + (campaignsPerMonth * 0.015), 1.25)
    
    // ========== CAMPAIGN REVENUE ==========
    /**
     * Campaign revenue calculation (straightforward linear)
     * 
     * Formula: # of Campaigns × Campaign RPR × Engaged List Size
     * 
     * Uses engaged list (40% of total) because only engaged subscribers open emails
     * Can be overridden manually if user has actual campaign revenue data
     */
    const defaultAvgCampaignRev = industry.campaignRPR * engagedListSize
    const avgCampaignRev = useManualCampaignRev ? manualAvgCampaignRev : defaultAvgCampaignRev
    const campaignRevenue = campaignsPerMonth * avgCampaignRev
    const campaignRPR = avgCampaignRev / engagedListSize
    
    // ========== FLOW REVENUE ==========
    /**
     * Flow revenue calculation (complex - based on Klaviyo benchmarks)
     * 
     * Step 1: Sum individual flow RPRs from Klaviyo benchmarks
     * These are already scaled based on revenue bracket + AOV
     */
    const totalFlowRPR = flowRPRBenchmarks.abandonedCart + 
                         flowRPRBenchmarks.welcome + 
                         flowRPRBenchmarks.postPurchase + 
                         flowRPRBenchmarks.browseAbandonment
    
    /**
     * Step 2: Apply flow efficiency multiplier
     * 
     * Logic:
     * - First 4 flows are "core" (cart, welcome, post-purchase, browse)
     * - If you have < 4 flows: scale down proportionally
     * - If you have > 4 flows: each additional flow adds 15% more revenue
     * 
     * Examples:
     * - 2 flows = 0.50 efficiency (50% of full potential)
     * - 4 flows = 1.00 efficiency (100% - all core flows)
     * - 10 flows = 1.90 efficiency (190% - core + 6 extra @ 15% each)
     */
    let flowEfficiency = 1.0
    if (numberOfFlows > 4) {
      const extraFlows = numberOfFlows - 4
      flowEfficiency = 1.0 + (extraFlows * 0.15) // Each extra flow adds 15% more
    } else {
      flowEfficiency = numberOfFlows / 4 // If less than 4, scale down proportionally
    }
    
    /**
     * Step 3: Calculate final flow revenue
     * 
     * Formula: New Subscribers × Total Flow RPR × Efficiency × Campaign Multiplier
     * 
     * Key insight: Flow revenue comes from NEW subscribers entering flows each month
     * Campaign multiplier boosts this because more campaigns = more flow triggers
     */
    const flowRevenue = newSubscribersPerMonth * totalFlowRPR * flowEfficiency * campaignMultiplier
    const flowRPR = flowRevenue / newSubscribersPerMonth
    
    // ========== TOTAL EMAIL REVENUE ==========
    const totalEmailRevenue = campaignRevenue + flowRevenue
    const totalEmailRPR = totalEmailRevenue / engagedListSize

    // ========== ATTRIBUTION-CORRECTED REVENUE ==========
    // Apply 20% last-touch discount: purchases that would have occurred without email
    const incrementalEmailRevenue = totalEmailRevenue * (1 - LAST_TOUCH_OVERLAP_RATE)
    const lastTouchRevenue = totalEmailRevenue * LAST_TOUCH_OVERLAP_RATE
    // True total = what the business had PLUS what email genuinely added
    const trueNewTotalRevenue = totalMonthlyRevenue + incrementalEmailRevenue
    // Email-attributed % calculated off the correct combined total
    const emailAttributedPercent = trueNewTotalRevenue > 0
      ? (incrementalEmailRevenue / trueNewTotalRevenue) * 100
      : 0

    // ========== COSTS ==========
    const totalEmailCost = monthlyRetainer + klaviyoCost
    
    // ========== ROI CALCULATIONS ==========
    /**
     * Two types of ROI:
     * 
     * 1. Gross ROI (revenue-based): Total Email Revenue / Total Costs
     *    - Shows revenue multiple (e.g., 18x = $18 revenue per $1 spent)
     *    - Useful but doesn't account for profit margins
     * 
     * 2. Net ROI (profit-based): Net Profit / Total Costs
     *    - Accounts for gross margin (not all revenue is profit)
     *    - More realistic measure of actual return
     *    - This is what we prominently display to prospects
     */
    const grossROI = totalEmailRevenue / totalEmailCost
    const emailGrossProfit = totalEmailRevenue * (grossMargin / 100)
    const netProfitFromEmail = emailGrossProfit - totalEmailCost
    const netROI = netProfitFromEmail / totalEmailCost
    
    // Return all calculated values
    return {
      campaignRevenue,
      campaignRPR,
      avgCampaignRev,
      flowRevenue,
      flowRPR,
      totalFlowRPR,
      totalEmailRevenue,
      totalEmailRPR,
      incrementalEmailRevenue,
      lastTouchRevenue,
      trueNewTotalRevenue,
      emailAttributedPercent,
      totalEmailCost,
      grossROI,
      emailGrossProfit,
      netProfitFromEmail,
      netROI,
      klaviyoCost,
      campaignMultiplier,
      newSubscribersPerMonth,
      annualRevenue,
      flowRPRBenchmarks
    }
  }, [selectedIndustry, engagedListSize, campaignsPerMonth, numberOfFlows, monthlyRetainer, grossMargin, totalMonthlyRevenue, industry, klaviyoCost, useManualCampaignRev, manualAvgCampaignRev, newSubscribersPerMonth, flowRPRBenchmarks, annualRevenue])

  // Calculate scenarios
  const scenarioData = useMemo(() => {
    const scenarios = [
      { key: 'typical', label: '90% of Brands (Underperforming)', campaigns: industry.typical.campaigns, flows: industry.typical.flows, color: 'red' },
      { key: 'your', label: 'Your Current Setup', campaigns: campaignsPerMonth, flows: numberOfFlows, color: 'yellow' },
      { key: 'good', label: 'Good Performance', campaigns: industry.good.campaigns, flows: industry.good.flows, color: 'blue' },
      { key: 'best', label: 'Best-in-Class (Top 1%)', campaigns: industry.best.campaigns, flows: industry.best.flows, color: 'green' }
    ]

    return scenarios.map(scenario => {
      const avgCampRev = industry.campaignRPR * engagedListSize
      const campRev = scenario.campaigns * avgCampRev

      // Flow calculation with diminishing returns
      let flowRevenueFactor = 0
      if (scenario.flows <= 10) {
        flowRevenueFactor = scenario.flows / 20
      } else {
        const additionalFlows = scenario.flows - 10
        flowRevenueFactor = 0.5 + (0.5 * (1 - Math.exp(-additionalFlows / 10)))
      }
      const flowRPRMonthly = industry.flowRPR * 0.015
      const maxFlowRev = 20 * flowRPRMonthly * engagedListSize
      const flowRev = flowRevenueFactor * maxFlowRev

      let totalRev = campRev + flowRev

      // Override Good and Best-in-Class to target specific email attribution %
      // emailPercent = (totalRev * 0.8) / (totalMonthlyRevenue + totalRev * 0.8)
      // Good  ~25%: totalRev = totalMonthlyRevenue * 5/12
      // Best  ~40%: totalRev = totalMonthlyRevenue * 5/6
      if (scenario.key === 'good') {
        totalRev = totalMonthlyRevenue * 5 / 12
      } else if (scenario.key === 'best') {
        totalRev = totalMonthlyRevenue * 5 / 6
      }
      const cost = monthlyRetainer + klaviyoCost
      const grossProf = totalRev * (grossMargin / 100)
      const netProf = grossProf - cost
      const netROI = netProf / cost
      const incrementalRev = totalRev * (1 - LAST_TOUCH_OVERLAP_RATE)
      const combinedTotal = totalMonthlyRevenue + incrementalRev
      const emailPercent = combinedTotal > 0 ? (incrementalRev / combinedTotal) * 100 : 0

      return {
        ...scenario,
        totalRevenue: totalRev,
        netProfit: netProf,
        netROI,
        emailPercent
      }
    })
  }, [selectedIndustry, engagedListSize, campaignsPerMonth, numberOfFlows, monthlyRetainer, grossMargin, totalMonthlyRevenue, industry, klaviyoCost])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals)
  }

  // Generate campaign chart data
  // Shape: linear ramp → first peak (~11 campaigns) → soft plateau → second higher peak (~24) → slow decline
  const campaignChartData = useMemo(() => {
    const points = []
    const avgCampRev = industry.campaignRPR * engagedListSize
    const basePeak = 11 * avgCampRev
    for (let c = 0; c <= 30; c++) {
      let factor
      if (c <= 11) {
        factor = c / 11                                        // linear ramp to peak 1
      } else if (c <= 17) {
        const t = (c - 11) / 6
        factor = 1.0 - 0.08 * Math.sin(t * Math.PI)          // soft plateau / slight dip between peaks
      } else if (c <= 24) {
        const t = (c - 17) / 7
        factor = 0.96 + 0.26 * t                              // second rise to peak 2 (~1.22x peak1)
      } else {
        factor = 1.22 - 0.018 * (c - 24)                     // diminishing returns beyond 25
      }
      points.push({ campaigns: c, revenue: factor * basePeak })
    }
    return points
  }, [industry, engagedListSize])

  // Generate flow chart data
  // Shape: near-linear for first 8 flows (40% of revenue), then parabolic slowdown for flows 9-30 (remaining 60%)
  const flowChartData = useMemo(() => {
    const points = []
    const flowRPRMonthly = industry.flowRPR * 0.015
    const maxFlowRevenue = 20 * flowRPRMonthly * engagedListSize
    for (let f = 0; f <= 30; f++) {
      let factor
      if (f <= 8) {
        factor = (f / 8) * 0.40                               // near-linear: 0 → 40% at flow 8
      } else {
        factor = 0.40 + 0.60 * (1 - Math.exp(-(f - 8) / 8)) // parabolic curve unlocking the other 60%
      }
      points.push({ flows: f, revenue: factor * maxFlowRevenue })
    }
    return points
  }, [industry, engagedListSize])

  // ==================== SECTION CARD COMPONENT ====================
  const SectionCard = ({
    index, title, content, accentColor, cardType, isOpen, onToggle,
  }: {
    index: number; title: string; content: string
    accentColor: 'blue' | 'purple'; cardType: 'campaign' | 'flow'
    isOpen: boolean; onToggle: () => void
  }) => {
    const bg = accentColor === 'blue' ? 'bg-blue-600' : 'bg-purple-600'
    const html = cardType === 'campaign' ? renderEmailHtml(content) : renderFlowHtml(content)
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
        <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 ${bg} text-white rounded-lg flex items-center justify-center font-bold text-sm shrink-0`}>
              {index}
            </div>
            <div className="font-semibold text-gray-900">{title}</div>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div
            className={`border-t border-gray-100 pt-5 pb-6 ${cardType === 'campaign' ? 'px-8 text-center' : 'px-6'}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    )
  }

  // ==================== FULL-BLOB EDIT PANEL ====================
  // Shows a textarea for the entire campaigns or flows markdown blob
  const EditPanel = ({ field, label }: { field: 'campaigns' | 'flows'; label: string }) => {
    const current = field === 'campaigns'
      ? (prospectData?.campaigns_markdown ?? '')
      : (prospectData?.flows_markdown ?? '')
    const [draft, setDraft] = useState(current)
    const isSaving = savingField === field

    return (
      <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-orange-800">Editing: {label}</span>
          <div className="flex gap-2">
            <button
              onClick={() => saveField(field, draft)}
              disabled={isSaving}
              className="px-4 py-1.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving to Sheet...' : 'Save to Sheet'}
            </button>
          </div>
        </div>
        <textarea
          className="w-full min-h-[320px] p-3 border border-orange-300 rounded-lg font-mono text-xs focus:border-orange-500 focus:outline-none bg-white"
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <p className="text-xs text-orange-700 mt-2">
          Use ## headings to create separate cards (e.g. <code>## Campaign 1: Welcome Offer</code>). Changes save to Google Sheets column {field === 'campaigns' ? 'M' : 'N'}.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ==================== NAV ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/60 backdrop-blur-lg border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="font-bold text-white text-xl tracking-tight">Mars Copywriting</div>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#results" className="text-sm text-gray-400 hover:text-white transition-colors">Results</a>
            <a href="#reviews" className="text-sm text-gray-400 hover:text-white transition-colors">Reviews</a>
            <a href="#services" className="text-sm text-gray-400 hover:text-white transition-colors">Services</a>
            <a href="#calculator" className="text-sm text-gray-400 hover:text-white transition-colors">ROI Calculator</a>
            {prospectSlug && (
              <button
                onClick={() => setActiveSection('deliverables')}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-semibold"
              >
                Free Deliverables for {prospectName}
              </button>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {isEditMode && (
              <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded-full">Edit Mode</span>
            )}
            <a
              href="https://portal.marscopywriting.co"
              className="text-sm text-white bg-purple-600 hover:bg-purple-500 font-semibold px-4 py-2.5 rounded-lg transition-all duration-200"
            >
              Client Login
            </a>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section id="hero" className="hero-bg pt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center w-full">
          {/* Pill tag */}
          <div className="inline-flex items-center gap-2 bg-purple-950/60 border border-purple-700/40 rounded-full px-4 py-1.5 text-sm text-purple-200 font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="font-bold text-white">Attention:</span>
            Ecommerce brands doing at least $1M-$10M/year
          </div>

          {/* Headline */}
          <h1 className="text-[2rem] sm:text-5xl lg:text-[3.75rem] font-extrabold text-white leading-[1.05] tracking-[-0.03em] glow-text-purple mb-5 text-balance">
            We&rsquo;ll Add <span className="text-purple-300">$50,000-$100,000</span> Per Month in New Email Revenue in 90 Days{' '}
            <span className="whitespace-nowrap border-b-[3px] border-purple-500 pb-1">or You Don&rsquo;t Pay</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-7 max-w-3xl mx-auto text-balance">
            Done-for-you email system for ecommerce brands doing at least $1M-$10M/year. No &ldquo;race-to-the-bottom&rdquo; discount strategies. Maximize your existing traffic, no additional ad spend required, <span className="text-white font-semibold">guaranteed results.</span>
          </p>

          {/* Video */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <div className="aspect-video bg-[#0d0d18] border border-purple-800/40 rounded-2xl flex flex-col items-center justify-center glow-purple-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent pointer-events-none" />
              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              {/* EMBED VIDEO — paste your Wistia or Vimeo iframe src here */}
              <p className="absolute bottom-3 text-xs text-gray-600 font-mono">[ YOUR VSL GOES HERE ]</p>
            </div>
          </div>

          {/* CTA */}
          {/* BOOK CALL — replace href with your Calendly or booking link */}
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white font-bold px-7 py-3.5 rounded-xl text-base transition-all duration-200 glow-purple-sm hover:glow-purple mb-2"
          >
            Book a Free Call →
          </a>
          <p className="text-xs text-gray-600 mt-2">No contract lock-in. Cancel any time. Billed month-to-month.</p>
        </div>
      </section>

      {/* ==================== STATS BAR ==================== */}
      <section className="bg-[#0d0d18] border-y border-purple-900/20">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-purple-900/30">
            {[
              { stat: '$8.5M+', label: 'Revenue driven for clients' },
              { stat: '1,025%', label: 'Highest single brand revenue increase' },
              { stat: '+112% YoY', label: 'Fastest brand growth' },
            ].map((item, i) => (
              <div key={i} className="text-center px-4 sm:px-8 py-5 sm:py-4">
                <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2 glow-text-purple tabular-nums">{item.stat}</div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TRUSTED BY ==================== */}
      <section className="bg-[#08080f] py-5 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-8">
          <span className="text-xs text-gray-600 font-semibold tracking-widest uppercase whitespace-nowrap">Trusted by</span>
          <TrustedByLogos images={trustedImages} />
        </div>
      </section>

      {/* ==================== CASE STUDIES ==================== */}
      <section id="results" className="bg-[#08080f] py-24 px-6 border-t border-white/5">
          <div className="reveal max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Real Results From Real Brands</h2>
            <p className="text-gray-500">What happens when email is done right.</p>
          </div>

          {/* ===== Flagship case studies ===== */}
          <div className="max-w-3xl mx-auto space-y-8 mb-16">
            {[
              {
                brand: 'PATCHED',
                folder: 'patched',
                headlineBig: '$776K in email revenue in 6 months.',
                headlineSub: 'From a brand that had been burned by an unfit agency, a 0.12% spam rate, and zero campaigns ever sent.',
                href: 'https://gamma.app/docs/PATCHED-Email-Marketing-Case-Study-v159pr7e7irgoww?mode=doc',
                cta: 'Read the full PATCHED case study',
                bullets: [
                  `The broken CheckoutChamp trigger that was silently firing a 10% discount to people mid-purchase — cannibalizing revenue from buyers who never needed the nudge, and why fixing this one flow logic error was worth more than any subject line test`,
                  `How a 0.12% spam rate (caused by emailing people about abandoned carts they'd already completed) was quietly destroying inbox placement — and the exact exclusion filter fix that brought it down to 0.028% in 6 months`,
                  `The list warm-up strategy we used on 100,000 contacts who had never received a single campaign — starting with a few hundred recipients and expanding every 2–3 days until campaigns were averaging $5,000 per send within 90 days`,
                  `Why 70% of the campaigns we sent had zero design, zero discounts, and subject lines like "Big Pharma Can't Patent These" — and how plain text emails treating readers like intelligent adults generated $327K in campaign revenue from a dead list`,
                  `The "next expected order" post-purchase flow branching by product tier that ended up rivalling abandoned checkout revenue — built because we spotted a Night Burn communication gap in our custom dashboard before the client noticed a single lost sale`,
                ],
              },
              {
                brand: 'Cerberus Collective',
                folder: 'cerberus',
                headlineBig: 'CA$322K in email revenue in 6 months.',
                headlineSub: 'Built from scratch in 90 days — before they spent a single ad dollar.',
                href: 'https://gamma.app/docs/Cerberus-Collective-building-an-email-backend-that-captured-eve-3dxhtdgt3v6i97t?mode=doc',
                cta: 'Read the full Cerberus case study',
                bullets: [
                  `The 3-field pop-up change that doubled their submit rate from 10% to 21% overnight — and sent 30% more subscribers straight into the buying sequence (most brands ignore this and wonder why their list doesn't convert)`,
                  `How we built 8 flows from scratch and had the entire email backend live before a single ad dollar dropped — so when July came, every new visitor hit a system that was ready for them`,
                  `The Klaviyo bug that silently skipped 18,000% more SMS subscribers past the welcome flow entirely — we caught it, filed the ticket, and fixed it in 90 minutes before the client noticed a dollar missing`,
                  `The segmentation rule most brands get backwards: why we always email loyal buyers (2x+ purchasers) instead of excluding them — and how it drove the repeat purchase rate that pushed email to 26.84% of total store revenue`,
                  `The first campaign we sent after the infrastructure was built broke every record Cerberus had ever set — more than their previous 6–7 campaigns combined, in a single send`,
                ],
              },
            ].map((cs, i) => (
              <div key={i} className="reveal relative overflow-hidden rounded-2xl border border-purple-900/40 bg-gradient-to-br from-[#17102e] via-[#0d0d1a] to-[#08080f] p-7 md:p-10" style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="pointer-events-none absolute -top-28 -right-20 w-80 h-80 rounded-full bg-purple-700/20 blur-3xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">Case Study</span>
                    <span className="h-px flex-1 bg-white/10"></span>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{cs.brand}</span>
                  </div>
                  <h3 className="font-extrabold text-white mb-7">
                    <span className="block text-[1.7rem] md:text-4xl leading-[1.1] glow-text-purple">{cs.headlineBig}</span>
                    <span className="block mt-3 text-base md:text-lg font-semibold text-gray-400 leading-snug">{cs.headlineSub}</span>
                  </h3>
                  <div className="rounded-xl bg-white/5 border border-white/[0.08] p-5 md:p-6">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">What We Did</div>
                    <ul className="space-y-3.5">
                      {cs.bullets.map((b, j) => (
                        <li key={j} className="flex gap-3 text-gray-300 text-sm md:text-[0.95rem] leading-relaxed">
                          <svg className="w-4 h-4 mt-1 shrink-0 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ProofMosaic
                    basePath={`/images/case-studies/${cs.folder}`}
                    images={caseImages[cs.folder] || []}
                    alt={`${cs.brand} case study proof`}
                  />
                  <div className="mt-8 flex justify-center">
                    <a
                      href={cs.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-12 py-5 text-xl font-bold text-white shadow-[0_0_30px_rgba(124,58,237,0.35)] transition-all duration-200 hover:from-purple-500 hover:to-violet-500 hover:shadow-[0_0_45px_rgba(124,58,237,0.55)]"
                    >
                      {cs.cta}
                      <svg className="w-6 h-6 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <SocialProofCarousels />

          <div className="reveal max-w-2xl mx-auto text-center mb-12 mt-24">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">More Wins Across Brands</h3>
            <p className="text-gray-500">Fitness, luxury, and supplement brands, by the numbers.</p>
          </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">

            {/* Case Study 1 */}
            <div className="reveal rounded-2xl overflow-hidden border border-purple-900/40 bg-gradient-to-br from-[#17102e] via-[#0d0d1a] to-[#08080f]">
              <div className="bg-purple-900/20 px-6 py-3.5 flex items-center gap-3 border-b border-purple-800/30">
                <span className="bg-purple-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</span>
                <span className="text-white font-semibold">Fitness Brand</span>
                <span className="ml-auto text-green-400 text-xs">112% year-over-year improvement</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-red-950/40 rounded-xl p-4 border border-red-900/30">
                    <div className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Before</div>
                    <p className="text-gray-300 text-sm">1-2 emails/week, generating <strong className="text-white">$45K monthly</strong>.</p>
                  </div>
                  <div className="bg-green-950/40 rounded-xl p-4 border border-green-900/30">
                    <div className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">After</div>
                    <p className="text-gray-300 text-sm">4-5 emails/week, <strong className="text-white">$98K monthly</strong>. +112% YoY.</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/[0.08]">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">What We Did</div>
                  <p className="text-gray-400 text-sm leading-relaxed">Monthly calendar approved one week before each month. Mix of plain-text and design emails, YouTube videos repurposed into value-based content, zero discounts to protect margins.</p>
                </div>
                <ProofMosaic basePath="/images/brand-results/fitness" images={brandImages['fitness'] || []} alt="Fitness brand proof" size="sm" />
              </div>
            </div>

            {/* Case Study 2 */}
            <div className="reveal rounded-2xl overflow-hidden border border-purple-900/40 bg-gradient-to-br from-[#17102e] via-[#0d0d1a] to-[#08080f]">
              <div className="bg-purple-900/20 px-6 py-3.5 flex items-center gap-3 border-b border-purple-800/30">
                <span className="bg-purple-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</span>
                <span className="text-white font-semibold">Luxury Brand</span>
                <span className="ml-auto text-green-400 text-xs">1,025% revenue increase</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-red-950/40 rounded-xl p-4 border border-red-900/30">
                    <div className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Before</div>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li><strong className="text-white">$6.5K</strong>/mo revenue</li>
                      <li><strong className="text-white">12.1%</strong> bounce rate</li>
                      <li><strong className="text-white">37.2%</strong> open rate</li>
                    </ul>
                  </div>
                  <div className="bg-green-950/40 rounded-xl p-4 border border-green-900/30">
                    <div className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">After</div>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li><strong className="text-white">$73.6K</strong>/mo (+1,025%)</li>
                      <li><strong className="text-white">0.80%</strong> bounce rate</li>
                      <li><strong className="text-white">49.2%</strong> open rate</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/[0.08]">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">What We Did</div>
                  <p className="text-gray-400 text-sm leading-relaxed">They were sending zero emails. We started at 4/week, got them out of spam and into primary inboxes - and they started generating revenue right in time for BFCM.</p>
                </div>
                <ProofMosaic basePath="/images/brand-results/luxury" images={brandImages['luxury'] || []} alt="Luxury brand proof" size="sm" />
              </div>
            </div>

            {/* Case Study 3 - Combined */}
            <div className="reveal rounded-2xl overflow-hidden border border-purple-900/40 bg-gradient-to-br from-[#17102e] via-[#0d0d1a] to-[#08080f]">
              <div className="bg-purple-900/20 px-6 py-3.5 flex items-center gap-3 border-b border-purple-800/30">
                <span className="bg-purple-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</span>
                <span className="text-white font-semibold">Supplement Brand - Copy & Conversion Testing</span>
                <span className="ml-auto text-green-400 text-xs">21% higher CVR + 8.72% pop-up</span>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Plain Text vs Design Email</div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/[0.08]">
                      <div className="text-xs text-gray-500 mb-1">Design Email</div>
                      <div className="text-gray-300 text-sm"><strong className="text-white">$9.3K</strong> - 9.42% CVR</div>
                    </div>
                    <div className="bg-green-950/40 rounded-xl p-3 border border-green-900/30">
                      <div className="text-xs text-green-400 mb-1">Plain Text Email</div>
                      <div className="text-gray-300 text-sm"><strong className="text-white">$11.3K</strong> - 13.12% CVR (+21%)</div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">Story-based, dialogue-style emails outperformed design by 21% placed order rate - every single campaign.</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Value-Based vs Discount Emails</div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[['6/10', 'top campaigns, zero discounts'], ['70-82%', 'open rates'], ['>0.7%', 'CTR consistently']].map(([stat, label], i) => (
                      <div key={i} className="bg-green-950/40 rounded-xl p-3 border border-green-900/30 text-center">
                        <div className="text-lg font-bold text-green-400">{stat}</div>
                        <div className="text-xs text-gray-500 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Pop-Up Form Optimization</div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-red-950/40 rounded-xl p-3 border border-red-900/30">
                      <div className="text-xs text-red-400 mb-1">Before</div>
                      <div className="text-gray-300 text-sm"><strong className="text-white">2.13%</strong> conversion rate</div>
                    </div>
                    <div className="bg-green-950/40 rounded-xl p-3 border border-green-900/30">
                      <div className="text-xs text-green-400 mb-1">After</div>
                      <ul className="text-gray-300 text-sm space-y-0.5">
                        <li><strong className="text-white">8.72%</strong> conversion</li>
                        <li><strong className="text-white">7,000</strong> new subs/month</li>
                        <li>Mobile: <strong className="text-white">$128K</strong> in 2 months</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <ProofMosaic basePath="/images/brand-results/supplement" images={brandImages['supplement'] || []} alt="Supplement brand proof" size="sm" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section id="reviews" className="bg-[#0d0d18] py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Kind Words</h2>
            <p className="text-gray-500">From founders and agency owners who've worked with Jacob.</p>
          </div>
          <div className="space-y-5">
            {[
              { folder: "daniel-filipe", quote: "Jacob is an incredible email marketer and copywriter... his work ethic and skillset is top 5%.", name: "Daniel Filipe", title: "Founder, Ecom Advertisers - 7-Figure Email Agency" },
              { folder: "marvin-sangines", quote: "Jacob is an absolute pleasure to work with... he delivers fantastic copywriting work. We worked on multiple projects together and he hasn't disappointed once.", name: "Marvin Sanginés", title: "Founder, notus - 7-Figure Personal Branding Agency" },
              { folder: "brando-monetti", quote: "Jacob wrote weeks of copy in advance and with his help we keep making more money for our clients. One client told us he's getting his best month of the year so far. Jacob is easy to talk to, works fast and always delivers.", name: "Brando Monetti", title: "CEO, Brand Lux Media" },
              { folder: "mason-doerr", quote: "He doesn't stop until he has every answer and angle he needs to get customers turning heads buying your products. Definitely someone you can grab a beer with and vibe while knowing you're making money together.", name: "Mason Doerr", title: "Founder, CopyMBA" },
              { folder: "thom-benny", quote: "Jacob's got a great instinct for finding a way to sell the unsellable.", name: "Thom Benny", title: "7-Figure Financial Copywriter for Agora (Billion Dollar Publisher)" },
            ].map((t, i) => (
              <div key={i} className="reveal card-dark rounded-2xl p-6" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-yellow-400 text-xl mb-3 tracking-wider">★★★★★</div>
                <p className="text-gray-300 italic leading-relaxed mb-5">"{t.quote}"</p>
                <div className="border-t border-white/10 pt-4 flex items-center gap-3">
                  <Avatar basePath={`/images/testimonials/${t.folder}`} image={(testimonialImages[t.folder] || [])[0]} name={t.name} />
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FIT SECTION ==================== */}
      <section id="fit" className="bg-[#08080f] py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="reveal text-4xl font-bold text-white mb-14">This is for you if:</h2>

          <ol className="reveal">
            {[
              "You're doing $1M-$10M+ per year and email is stuck around 10% attributed revenune and 80% of it is just the welcome flow, while you know it should be 30-40%",
              "You're sending 2 campaigns per month because you're afraid of unsubscribes, but your list you paid Meta to acquire is dying from underuse and you're leaving $30K-$50K on the table every single month",
              "Your agency sends templated batch-and-blast emails with 20% off every other week without understanding your margins, so your profit gets crushed, and you're training customers to never buy unless there's a sale.",
              "You pay Klaviyo thousands of dollars per month and have 50k-100K+ subscribers but only 20k are engaged because no one's done proper list hygiene, segmentation, or deliverability management in 18 months to lower the Klaviyo bill by 50-80%.",
              "You have 10-100k website visitors per month but your signup form converts only 1-3% submit rates (should be 10%+ without hurting your on-site conversion rates). Most brands are scared to use signup forms because the myth is they hurt conversions, but that's the case for badly designed signup forms with bad offers.",
              "You're spending $50K-$500k per month on paid ads to acquire customers, but your email backend isn't built to retain them, so you're bleeding LTV and wondering why CAC keeps climbing.",
            ].map((item, i) => (
              <li
                key={i}
                className="group flex items-start gap-6 sm:gap-8 py-7 border-t border-white/[0.08] first:border-t-0 first:pt-0"
              >
                <span className="shrink-0 w-10 text-2xl font-extrabold tabular-nums text-purple-500/45 leading-snug transition-colors duration-300 group-hover:text-purple-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[0.9375rem] sm:text-base text-gray-300 leading-[1.7] max-w-[65ch]">{item}</p>
              </li>
            ))}
          </ol>

          {/* Not a fit */}
          <div className="reveal mt-16 pt-10 border-t border-red-900/30">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-red-400/80 mb-5">Not a fit if...</h3>
            <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
              {[
                "You're not running an ecommerce store",
                "You want cheap, templated batch-and-blast emails",
                "You need someone to run paid ads",
                "You're not open to testing and iterating on copy",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-500">
                  <span className="mt-px text-red-500/70 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ==================== WHAT WE DO ==================== */}
      <section id="services" className="bg-[#0d0d18] py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="reveal text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What We Do</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">End-to-end email marketing for ecommerce brands that want revenue without burning margins on discounts.</p>
          </div>
          <div className="reveal grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "✉️", title: "Campaign Copywriting", desc: "Weekly campaigns - plain text, story-based, and design - written to convert without discounting your margins away." },
              { icon: "⚙️", title: "Flow Automation Setup", desc: "Welcome, abandoned cart, post-purchase, win-back, browse abandon, and 15+ more flows built and optimized." },
              { icon: "🎯", title: "Pop-Up Form Optimization", desc: "Multi-step pop-ups with DR copy and design engineered to hit 8-15% conversion rates and compound into everything downstream." },
              { icon: "📅", title: "Monthly Email Calendar", desc: "Full monthly strategy delivered one week before each new month. You approve it, we execute." },
              { icon: "📊", title: "Klaviyo Setup & Management", desc: "Full account setup, list hygiene, segmentation, deliverability management, and performance reporting." },
              { icon: "🔬", title: "Split Testing & Optimization", desc: "Ongoing A/B testing of subject lines, send times, copy styles, and offers to continuously compound results." }
            ].map((s, i) => (
              <div key={i} className="card-dark rounded-2xl p-6 transition-all duration-200">
                <div className="text-3xl mb-4">{s.icon}</div>
                <div className="font-bold text-white text-lg mb-2">{s.title}</div>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="bg-[#08080f] py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you need to know before booking a call.</p>
          </div>
          <div className="divide-y divide-white/[0.08]">
            {[
              {
                q: 'What if we’re already working with an email agency?',
                a: "Most of our clients came to us after their previous agency underdelivered. We'll do a free audit of your current setup and show you exactly what's being left on the table. If your current agency is doing a great job, we'll tell you. If they're not, you'll see the difference in the first 30 days.",
              },
              {
                q: 'How does your guarantee work?',
                a: 'We only work with brands doing at least $1M per year because the math works. If you’re doing $100,000 per month in store revenue, getting to 20-30% email-attributed revenue means $20,000-$30,000 from email. Our case studies show we consistently hit $50,000-$100,000 in the first 90 days for brands in that range. If we don’t hit $50,000 in attributed revenue as measured in your Klaviyo dashboard, you get every dollar back.',
              },
              {
                q: 'Do you require long-term contracts?',
                a: "No. We work month-to-month. If you're not happy after 90 days and we didn't hit the guarantee, you get a full refund and you can walk away. If we did hit the guarantee and you're making an extra $50,000-$100,000 per month, you'll probably want to keep going.",
              },
              {
                q: 'What if our list is small or dead?',
                a: "We've revived lists with 0.12% spam rates and 100,000 dormant contacts. We've built email programs from scratch for brand new stores before they spent a dollar on ads. List size and health are problems we solve in the first 30 days, not reasons we can't work together.",
              },
              {
                q: 'How many emails will you actually send?',
                a: 'We send 12-18 campaigns per month, sometimes more. We also build 8-12 automated flows with 30-55 emails total. This is significantly more than most agencies because we know how to do it without burning your list. Our clients maintain 50% open rates and sub-0.02% spam rates even at high frequency.',
              },
              {
                q: 'What industries do you work with?',
                a: "We love supplements, beauty, skincare, pet products, apparel, and subscription boxes. Our case studies shine here. Basically any ecommerce brand doing $1M-$10M per year with a product people buy more than once. If you're in a different vertical but fit the revenue range, book a call and we'll tell you if we're a good fit.",
              },
              {
                q: 'Do you write the emails or do we?',
                a: 'We write everything. You approve the strategy briefs and the Figma designs, but we handle all copywriting, design coordination, technical setup, and deployment. You get weekly reports and stay in the loop, but you don’t have to write a single word or touch Klaviyo unless you want to.',
              },
              {
                q: 'What platforms do you work with?',
                a: "We work primarily with Klaviyo and Omnisend. If you're on a different platform, we can discuss migration or compatibility on a call.",
              },
            ].map((item, i) => (
              <div key={i}>
                <h3>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-panel-${i}`}
                    className="w-full flex items-start justify-between text-left gap-6 py-6 group"
                  >
                    <span className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors duration-200">{item.q}</span>
                    <svg
                      className={`w-6 h-6 mt-0.5 shrink-0 transition-[transform,color] duration-300 ease-out ${openFaq === i ? 'rotate-180 text-purple-400' : 'text-gray-600 group-hover:text-gray-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pr-10 text-gray-400 leading-[1.7] max-w-[68ch]">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== DELIVERABLES SECTION ==================== */}
      {prospectSlug && activeSection === 'deliverables' && (
        <section className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                Free Strategy Preview
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Email Deliverables for {prospectName}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Here&apos;s what we&apos;d build for {prospectName} in the first 14 days.
                Campaign emails + automated flows - ready to deploy.
              </p>
            </div>

            {/* Loading / Error */}
            {prospectLoading && (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading deliverables...</p>
              </div>
            )}

            {prospectError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700 font-medium">{prospectError}</p>
              </div>
            )}

            {prospectData && !prospectLoading && (() => {
              const campaignSections = splitMarkdownSections(prospectData.campaigns_markdown)
              const flowSections = splitMarkdownSections(prospectData.flows_markdown)
              const allCampaignsOpen = campaignSections.length > 0 && expandedCampaigns.size === campaignSections.length
              const allFlowsOpen = flowSections.length > 0 && expandedFlows.size === flowSections.length
              return (
                <>
                  {/* Campaign Emails */}
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📧</span>
                        Campaign Emails ({campaignSections.length})
                      </h2>
                      {campaignSections.length > 0 && (
                        <button
                          onClick={() => setExpandedCampaigns(allCampaignsOpen ? new Set() : new Set(campaignSections.map((_, i) => i)))}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          {allCampaignsOpen ? 'Collapse All' : 'Expand All'}
                        </button>
                      )}
                    </div>

                    {isEditMode && <EditPanel field="campaigns" label="campaigns_markdown (col M)" />}

                    <div className="space-y-3">
                      {campaignSections.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No campaign content yet. Add <code>## Campaign 1: Title</code> sections to column M in your sheet.
                        </p>
                      )}
                      {campaignSections.map((s, idx) => (
                        <SectionCard
                          key={idx}
                          index={idx + 1}
                          title={s.title}
                          content={s.content}
                          accentColor="blue"
                          cardType="campaign"
                          isOpen={expandedCampaigns.has(idx)}
                          onToggle={() => toggleCampaign(idx)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Flow Automations */}
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">⚙️</span>
                        Flow Automations ({flowSections.length})
                      </h2>
                      {flowSections.length > 0 && (
                        <button
                          onClick={() => setExpandedFlows(allFlowsOpen ? new Set() : new Set(flowSections.map((_, i) => i)))}
                          className="text-sm font-medium text-purple-600 hover:text-purple-800 px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          {allFlowsOpen ? 'Collapse All' : 'Expand All'}
                        </button>
                      )}
                    </div>

                    {isEditMode && <EditPanel field="flows" label="flows_markdown (col N)" />}

                    <div className="space-y-3">
                      {flowSections.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          No flow content yet. Add <code>## Flow 1: Title</code> sections to column N in your sheet.
                        </p>
                      )}
                      {flowSections.map((s, idx) => (
                        <SectionCard
                          key={idx}
                          index={idx + 1}
                          title={s.title}
                          content={s.content}
                          accentColor="purple"
                          cardType="campaign"
                          isOpen={expandedFlows.has(idx)}
                          onToggle={() => toggleFlow(idx)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
                    <h3 className="text-2xl font-bold mb-3">Ready to deploy these for {prospectName}?</h3>
                    <p className="text-white/90 mb-6 max-w-lg mx-auto">
                      These deliverables are ready to go live in 14 days. Check the ROI calculator to see the projected impact.
                    </p>
                    <button
                      onClick={() => setActiveSection('calculator')}
                      className="px-24 py-9 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors text-3xl shadow-lg"
                    >
                      See ROI Projections →
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </section>
      )}

      {/* ==================== CALCULATOR SECTION ==================== */}
    <section id="calculator" className={`bg-[#08080f] py-16 sm:py-20 px-4 sm:px-6 border-t border-white/5 ${prospectSlug && activeSection !== 'calculator' ? 'hidden' : ''}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Email Marketing ROI Calculator
            {prospectSlug && <span className="text-purple-400"> — {prospectName}</span>}
          </h2>
          <p className="text-gray-400 text-lg max-w-[65ch] mx-auto">
            See where you stand vs industry benchmarks · Based on Klaviyo data from 325B+ emails
          </p>
        </div>
        {/* ---------- STAGE 1: INPUTS ---------- */}
        <div className="rounded-2xl border border-purple-900/40 bg-[#0b0b16] p-5 sm:p-10">

          {/* Industry */}
          <CalcStep n="01" title="📊 Select Your Industry">
            <div className="flex flex-wrap gap-2">
              {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => {
                const active = selectedIndustry === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedIndustry(key as keyof typeof INDUSTRY_BENCHMARKS)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-200 ${
                      active
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-purple-700/60 hover:text-white'
                    }`}
                  >
                    {data.name}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                <div className="text-xs text-gray-500 mb-1">Campaign RPR</div>
                <div className="text-2xl font-bold text-white tabular-nums">${formatNumber(industry.campaignRPR, 3)}</div>
                <div className="text-xs text-gray-600 mt-0.5">per recipient</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                <div className="text-xs text-gray-500 mb-1">Flow RPR</div>
                <div className="text-2xl font-bold text-white tabular-nums">${formatNumber(industry.flowRPR, 2)}</div>
                <div className="text-xs text-gray-600 mt-0.5">per recipient</div>
              </div>
            </div>
          </CalcStep>

          {/* Business */}
          <CalcStep n="02" title="💼 Your Business">
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              <CalcSlider
                label="Email List Size"
                display={`${emailListSize.toLocaleString()} profiles`}
                value={emailListSize} min={500} max={500000} step={500}
                minLabel="500" maxLabel="500k"
                onChange={setEmailListSize}
              />
              <div>
                <div className="flex items-baseline justify-between gap-4 mb-2.5">
                  <label htmlFor="totalMonthlyRevenue" className="text-sm text-gray-400">Total Monthly Revenue</label>
                  <span className="text-xs text-gray-600 tabular-nums">
                    Annual: {formatCurrency(calculations.annualRevenue)}
                    <span className="ml-2 font-semibold text-purple-400">
                      ({calculations.annualRevenue < 1000000 ? '$0-1M' : calculations.annualRevenue < 5000000 ? '$1M-5M' : '$5M-20M'} bracket)
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    id="totalMonthlyRevenue"
                    type="number"
                    value={totalMonthlyRevenue}
                    onChange={(e) => setTotalMonthlyRevenue(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-lg tabular-nums focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <CalcSlider
                label="Average Order Value (AOV)"
                display={formatCurrency(averageOrderValue)}
                value={averageOrderValue} min={20} max={300} step={5}
                minLabel="$20" maxLabel="$300"
                onChange={setAverageOrderValue}
              />
              <CalcSlider
                label="Gross Profit Margin"
                display={`${grossMargin}%`}
                value={grossMargin} min={20} max={90}
                minLabel="20%" maxLabel="90%"
                onChange={setGrossMargin}
              />
            </div>

            <div className="grid sm:grid-cols-[auto_minmax(0,1fr)] gap-x-8 gap-y-3 items-baseline rounded-lg bg-white/[0.03] border border-white/[0.08] p-5">
              <div>
                <div className="text-xs text-gray-500 mb-1">📊 Engaged List Size</div>
                <div className="text-xl font-bold text-white tabular-nums whitespace-nowrap">{engagedListSize.toLocaleString()} profiles (40%)</div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your "true" list size is typically 30-40% of your total list. This is your engaged segment
                (90-240 day active subscribers) and is what we use for all revenue calculations.
              </p>
              <div className="sm:col-span-2 text-xs text-gray-500 border-t border-white/[0.08] pt-3">
                Klaviyo Cost: <span className="font-semibold text-purple-400 tabular-nums">{formatCurrency(klaviyoCost)}/month</span>
              </div>
            </div>
          </CalcStep>

          {/* Traffic & Pop-up */}
          <CalcStep n="03" title="🌐 Website Traffic & Pop-up">
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              <CalcSlider
                label="Monthly Website Visitors"
                display={monthlyTraffic.toLocaleString()}
                value={monthlyTraffic} min={1000} max={500000} step={1000}
                minLabel="1k" maxLabel="500k"
                onChange={setMonthlyTraffic}
              />
              <CalcSlider
                label="Pop-up Conversion Rate"
                display={`${popupConversionRate.toFixed(1)}%`}
                value={popupConversionRate} min={1} max={20} step={0.5}
                minLabel="1%" maxLabel="20%"
                onChange={setPopupConversionRate}
              />
            </div>

            <div className="rounded-lg border border-purple-700/40 bg-purple-950/30 p-5">
              <div className="text-sm font-semibold text-purple-300 mb-2">
                📊 New Subscribers Per Month
              </div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {calculations.newSubscribersPerMonth.toLocaleString()}
              </div>
              <div className="text-xs text-purple-300/70 mt-2 leading-relaxed">
                These {calculations.newSubscribersPerMonth.toLocaleString()} new subscribers enter your flows each month.
                <br/>
                <span className="font-semibold text-purple-300">Without traffic, there is no flow revenue.</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-4">
                <div className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-400">💡 Pop-up Benchmarks:</span>
                  <br/>• 1-3%: Typical (most brands)
                  <br/>• 5-8%: Good performance
                  <br/>• 10%+: Excellent (good offer/audience match)
                </div>
              </div>

              {calculations.campaignMultiplier > 1 && (
                <div className="rounded-lg bg-green-950/25 border border-green-800/30 p-4">
                  <div className="text-xs text-green-300/80 leading-relaxed">
                    <span className="font-semibold text-green-300">🔥 Campaign Multiplier Active:</span>
                    <br/>Your {campaignsPerMonth} campaigns/month are boosting flow revenue by{' '}
                    <span className="font-bold text-green-200">{((calculations.campaignMultiplier - 1) * 100).toFixed(1)}%</span>
                    <br/>(More campaigns = more people re-triggering flows)
                  </div>
                </div>
              )}
            </div>
          </CalcStep>

          {/* Email Strategy */}
          <CalcStep n="04" title="📧 Your Email Strategy">
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              <CalcSlider
                label="Campaigns per Month"
                display={String(campaignsPerMonth)}
                value={campaignsPerMonth} min={1} max={30}
                minLabel="1" maxLabel="30"
                onChange={setCampaignsPerMonth}
              />
              <CalcSlider
                label="Number of Active Flows"
                display={String(numberOfFlows)}
                value={numberOfFlows} min={1} max={20}
                minLabel="1" maxLabel="20"
                onChange={setNumberOfFlows}
              />
              <CalcSlider
                label="Monthly Retainer"
                display={formatCurrency(monthlyRetainer)}
                value={monthlyRetainer} min={2000} max={10000} step={500}
                minLabel="$2k" maxLabel="$10k"
                onChange={setMonthlyRetainer}
              />
            </div>

            {/* Manual Overrides */}
            <div className="border-t border-white/[0.08] pt-5">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">🎯 Manual Overrides (Optional)</h4>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="manualCampaign"
                  checked={useManualCampaignRev}
                  onChange={(e) => {
                    setUseManualCampaignRev(e.target.checked)
                    if (e.target.checked && manualAvgCampaignRev === 0) {
                      setManualAvgCampaignRev(calculations.avgCampaignRev)
                    }
                  }}
                  className="w-4 h-4 accent-purple-500"
                />
                <label htmlFor="manualCampaign" className="text-sm text-gray-300">
                  Set Average Campaign Revenue
                </label>
              </div>
              {useManualCampaignRev ? (
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={manualAvgCampaignRev}
                    onChange={(e) => setManualAvgCampaignRev(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-black/40 border border-white/10 text-white rounded-lg tabular-nums focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={`Default: ${formatCurrency(calculations.avgCampaignRev)}`}
                  />
                </div>
              ) : (
                <div className="text-xs text-gray-600 ml-6">
                  Default: {formatCurrency(industry.campaignRPR * engagedListSize)} per campaign
                </div>
              )}
            </div>
          </CalcStep>
        </div>

        {/* ---------- STAGE 2: RESULTS ---------- */}
        <div className="mt-8 space-y-6">
          <div className="space-y-6">
            {/* Current Performance */}
            <div className="bg-gradient-to-br from-purple-900 to-violet-950 rounded-xl border border-purple-700/40 p-6 text-white glow-purple-sm">
              <h2 className="text-2xl font-bold mb-6">📈 Your Current Performance (Monthly)</h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-sm opacity-90 mb-1">Campaign Revenue</div>
                  <div className="text-2xl font-bold">{formatCurrency(calculations.campaignRevenue)}</div>
                  <div className="text-xs opacity-75 mt-1">${formatNumber(calculations.campaignRPR, 3)} RPR</div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-sm opacity-90 mb-1">Flow Revenue</div>
                  <div className="text-xs opacity-75 mb-2">
                    (from {calculations.newSubscribersPerMonth.toLocaleString()} new subs/month)
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(calculations.flowRevenue)}/mo</div>
                  <div className="text-xs opacity-75 mt-1">${formatNumber(calculations.flowRPR, 2)} RPR per new sub</div>
                  <div className="text-xs opacity-75 mt-2 border-t border-white/20 pt-2">
                    Based on Klaviyo benchmarks:
                    <br/>• Cart: ${formatNumber(calculations.flowRPRBenchmarks.abandonedCart, 2)}
                    <br/>• Welcome: ${formatNumber(calculations.flowRPRBenchmarks.welcome, 2)}
                    <br/>• Post-Purchase: ${formatNumber(calculations.flowRPRBenchmarks.postPurchase, 2)}
                    <br/>• Browse: ${formatNumber(calculations.flowRPRBenchmarks.browseAbandonment, 2)}
                  </div>
                </div>

                {/* Total Revenue with green email-contribution bar */}
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur sm:col-span-2">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="text-sm opacity-90">Total Monthly Revenue</div>
                    <div className="text-xs opacity-60 italic">business + email</div>
                  </div>
                  <div className="text-3xl font-bold mb-3">
                    {formatCurrency(calculations.trueNewTotalRevenue)}
                  </div>

                  {/* Stacked bar: base revenue (white/translucent) + email increment (green gradient) */}
                  {(() => {
                    const baseW = (totalMonthlyRevenue / calculations.trueNewTotalRevenue) * 100
                    const emailW = (calculations.incrementalEmailRevenue / calculations.trueNewTotalRevenue) * 100
                    return (
                      <>
                        {/* Bar carries the proportion only. Labels live underneath at
                            every width, since a small email segment leaves no room
                            to render its figure legibly inside. */}
                        <div className="flex rounded-full overflow-hidden h-3 mb-3" style={{ gap: '2px' }}>
                          <div
                            className="bg-white/25 shrink-0"
                            style={{ width: `${Math.max(baseW, 18)}%` }}
                          />
                          <div className="flex-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-300" />
                        </div>
                        {/* Bullet colors key back to their segment in the bar above. */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-y-1.5 gap-x-6 text-xs mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-white/25 shrink-0" />
                            <span className="opacity-80">Base {formatNumber(baseW, 0)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                            <span className="font-semibold text-green-300">
                              +{formatCurrency(calculations.incrementalEmailRevenue)} email · {formatNumber(calculations.emailAttributedPercent, 1)}% of total
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  })()}

                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4 text-xs opacity-70 mt-1">
                    <span>Business base: {formatCurrency(totalMonthlyRevenue)}</span>
                    <span>Klaviyo gross: {formatCurrency(calculations.totalEmailRevenue)}</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-sm opacity-90 mb-1">Total Costs</div>
                  <div className="text-2xl font-bold">{formatCurrency(calculations.totalEmailCost)}</div>
                  <div className="text-xs opacity-75 mt-1">retainer + Klaviyo</div>
                </div>

                <div className="bg-green-400/15 border border-green-400/30 rounded-lg p-4 backdrop-blur">
                  <div className="text-sm text-green-200/90 mb-1">Gross ROI</div>
                  <div className="text-2xl font-bold text-green-300 tabular-nums">{formatNumber(calculations.grossROI, 1)}x</div>
                  <div className="text-xs text-green-200/70 mt-1">revenue</div>
                </div>

                <div className="bg-green-400/15 border border-green-400/30 rounded-lg p-4 backdrop-blur sm:col-span-2">
                  <div className="text-sm text-green-200/90 mb-1">Net Profit from Email</div>
                  <div className="text-3xl font-bold text-green-300 tabular-nums">{formatCurrency(calculations.netProfitFromEmail)}</div>
                  <div className="text-xs text-green-200/70 mt-1">
                    {formatNumber(calculations.netROI, 1)}x net ROI (profit-based)
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Revenue Chart */}
            <div className="bg-[#0b0b16] rounded-xl border border-white/[0.08] p-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                📈 Campaign Volume vs Revenue
              </h2>
              {(() => {
                const PAD_L = 74, PAD_R = 18, PAD_T = 48, PAD_B = 40
                const W = 620, H = 260
                const CW = W - PAD_L - PAD_R
                const CH = H - PAD_T - PAD_B
                const maxRev = Math.max(...campaignChartData.map(p => p.revenue))
                const toX = (c: number) => PAD_L + (c / 30) * CW
                const toY = (rev: number) => PAD_T + CH - (rev / maxRev) * CH
                const linePath = campaignChartData.map((p, i) =>
                  `${i === 0 ? 'M' : 'L'}${toX(p.campaigns).toFixed(1)},${toY(p.revenue).toFixed(1)}`
                ).join(' ')
                const areaPath = linePath + ` L${toX(30).toFixed(1)},${(PAD_T + CH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD_T + CH).toFixed(1)} Z`
                const cur = Math.min(campaignsPerMonth, 30)
                const curX = toX(cur)
                const curY = toY(campaignChartData[cur]?.revenue ?? 0)
                const yLevels = [1, 0.75, 0.5, 0.25, 0]
                const xTicks = [0, 6, 12, 18, 24, 30]
                const p1x1 = toX(9), p1x2 = toX(13)
                const p2x1 = toX(19), p2x2 = toX(26)
                return (
                  <div className="overflow-x-auto">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[560px]" role="img">
                    <defs>
                      <linearGradient id="campGrad" x1="0" y1={PAD_T} x2="0" y2={PAD_T + CH} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {/* Peak zone highlights */}
                    <rect x={p1x1} y={PAD_T} width={p1x2 - p1x1} height={CH} fill="#10b981" opacity="0.12" rx="2" />
                    <rect x={p2x1} y={PAD_T} width={p2x2 - p2x1} height={CH} fill="#2563eb" opacity="0.1" rx="2" />
                    {/* Horizontal grid lines */}
                    {yLevels.map((f, i) => (
                      <line key={i} x1={PAD_L} y1={toY(f * maxRev)} x2={PAD_L + CW} y2={toY(f * maxRev)} stroke="#ffffff12" strokeWidth="1" strokeDasharray="4,4" />
                    ))}
                    {/* Chart border */}
                    <rect x={PAD_L} y={PAD_T} width={CW} height={CH} fill="none" stroke="#7c3aed30" strokeWidth="1" />
                    {/* Area gradient fill */}
                    <path d={areaPath} fill="url(#campGrad)" />
                    {/* Line curve */}
                    <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Peak zone top labels */}
                    <text x={(p1x1 + p1x2) / 2} y={PAD_T - 17} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="700">Peak 1</text>
                    <text x={(p1x1 + p1x2) / 2} y={PAD_T - 5} textAnchor="middle" fill="#059669" fontSize="9">10–12/mo</text>
                    <text x={(p2x1 + p2x2) / 2} y={PAD_T - 17} textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="700">Peak 2</text>
                    <text x={(p2x1 + p2x2) / 2} y={PAD_T - 5} textAnchor="middle" fill="#a78bfa" fontSize="9">20–25/mo</text>
                    {/* Y-axis labels */}
                    {yLevels.map((f, i) => (
                      <text key={i} x={PAD_L - 5} y={toY(f * maxRev) + 4} textAnchor="end" fill="#6b7280" fontSize="10">{formatCurrency(f * maxRev)}</text>
                    ))}
                    {/* X-axis ticks + labels */}
                    {xTicks.map(v => (
                      <g key={v}>
                        <line x1={toX(v)} y1={PAD_T + CH} x2={toX(v)} y2={PAD_T + CH + 4} stroke="#9ca3af" strokeWidth="1" />
                        <text x={toX(v)} y={PAD_T + CH + 15} textAnchor="middle" fill="#6b7280" fontSize="10">{v}</text>
                      </g>
                    ))}
                    {/* X-axis title */}
                    <text x={PAD_L + CW / 2} y={H - 3} textAnchor="middle" fill="#6b7280" fontSize="11" fontWeight="500">Campaigns per Month</text>
                    {/* Current position */}
                    <line x1={curX} y1={PAD_T} x2={curX} y2={PAD_T + CH} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.65" />
                    <circle cx={curX} cy={curY} r="6" fill="#ef4444" stroke="white" strokeWidth="2.5" />
                    <text x={cur > 25 ? curX - 9 : curX + 9} y={Math.max(curY - 7, PAD_T + 13)} textAnchor={cur > 25 ? 'end' : 'start'} fill="#ef4444" fontSize="10" fontWeight="700">You</text>
                  </svg>
                  </div>
                )
              })()}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 mt-4">
                <p className="text-xs text-gray-500 leading-relaxed max-w-[68ch]">
                  <span className="font-semibold text-purple-400">Two performance peaks:</span> Most brands hit a first revenue peak at <strong className="text-white">10–12 campaigns/month</strong> - the sweet spot for list health and engagement. Brands that invest in segmentation and offer testing unlock a <strong className="text-white">second, higher peak at 20–25/month</strong>. Beyond 25, more volume yields diminishing returns; the strategy shifts to targeting fresh segments with new offers, not just higher frequency.
                </p>
              </div>
            </div>

            {/* Flow Revenue Chart */}
            <div className="bg-[#0b0b16] rounded-xl border border-white/[0.08] p-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                ⚙️ Flow Count vs Revenue
              </h2>
              {(() => {
                const PAD_L = 74, PAD_R = 18, PAD_T = 40, PAD_B = 40
                const W = 620, H = 260
                const CW = W - PAD_L - PAD_R
                const CH = H - PAD_T - PAD_B
                const maxRev = Math.max(...flowChartData.map(p => p.revenue))
                const toX = (f: number) => PAD_L + (f / 30) * CW
                const toY = (rev: number) => PAD_T + CH - (rev / maxRev) * CH
                const linePath = flowChartData.map((p, i) =>
                  `${i === 0 ? 'M' : 'L'}${toX(p.flows).toFixed(1)},${toY(p.revenue).toFixed(1)}`
                ).join(' ')
                const areaPath = linePath + ` L${toX(30).toFixed(1)},${(PAD_T + CH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD_T + CH).toFixed(1)} Z`
                const cur = Math.min(numberOfFlows, 30)
                const curX = toX(cur)
                const curY = toY(flowChartData[cur]?.revenue ?? 0)
                const yLevels = [1, 0.75, 0.5, 0.25, 0]
                const xTicks = [0, 6, 12, 18, 24, 30]
                const phaseX = toX(8)
                return (
                  <div className="overflow-x-auto">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[560px]" role="img">
                    <defs>
                      <linearGradient id="flowGrad" x1="0" y1={PAD_T} x2="0" y2={PAD_T + CH} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {/* Phase backgrounds */}
                    <rect x={PAD_L} y={PAD_T} width={phaseX - PAD_L} height={CH} fill="#8b5cf6" opacity="0.1" rx="2" />
                    <rect x={phaseX} y={PAD_T} width={PAD_L + CW - phaseX} height={CH} fill="#6366f1" opacity="0.04" rx="2" />
                    {/* Horizontal grid lines */}
                    {yLevels.map((f, i) => (
                      <line key={i} x1={PAD_L} y1={toY(f * maxRev)} x2={PAD_L + CW} y2={toY(f * maxRev)} stroke="#ffffff12" strokeWidth="1" strokeDasharray="4,4" />
                    ))}
                    {/* Chart border */}
                    <rect x={PAD_L} y={PAD_T} width={CW} height={CH} fill="none" stroke="#7c3aed30" strokeWidth="1" />
                    {/* Phase divider */}
                    <line x1={phaseX} y1={PAD_T} x2={phaseX} y2={PAD_T + CH} stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4" />
                    {/* Area gradient fill */}
                    <path d={areaPath} fill="url(#flowGrad)" />
                    {/* Line curve */}
                    <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Phase labels */}
                    <text x={(PAD_L + phaseX) / 2} y={PAD_T - 8} textAnchor="middle" fill="#7c3aed" fontSize="10" fontWeight="700">Core 40%</text>
                    <text x={(phaseX + PAD_L + CW) / 2} y={PAD_T - 8} textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="700">Hidden Revenue - 60% Most Brands Miss</text>
                    {/* Y-axis labels */}
                    {yLevels.map((f, i) => (
                      <text key={i} x={PAD_L - 5} y={toY(f * maxRev) + 4} textAnchor="end" fill="#6b7280" fontSize="10">{formatCurrency(f * maxRev)}</text>
                    ))}
                    {/* X-axis ticks + labels */}
                    {xTicks.map(v => (
                      <g key={v}>
                        <line x1={toX(v)} y1={PAD_T + CH} x2={toX(v)} y2={PAD_T + CH + 4} stroke="#9ca3af" strokeWidth="1" />
                        <text x={toX(v)} y={PAD_T + CH + 15} textAnchor="middle" fill="#6b7280" fontSize="10">{v}</text>
                      </g>
                    ))}
                    {/* X-axis title */}
                    <text x={PAD_L + CW / 2} y={H - 3} textAnchor="middle" fill="#6b7280" fontSize="11" fontWeight="500">Number of Active Flows</text>
                    {/* Current position */}
                    <line x1={curX} y1={PAD_T} x2={curX} y2={PAD_T + CH} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.65" />
                    <circle cx={curX} cy={curY} r="6" fill="#ef4444" stroke="white" strokeWidth="2.5" />
                    <text x={cur > 25 ? curX - 9 : curX + 9} y={Math.max(curY - 7, PAD_T + 13)} textAnchor={cur > 25 ? 'end' : 'start'} fill="#ef4444" fontSize="10" fontWeight="700">You</text>
                  </svg>
                  </div>
                )
              })()}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-4 mt-4">
                <p className="text-xs text-gray-500 leading-relaxed max-w-[68ch]">
                  <span className="font-semibold text-violet-400">40% from the first 8 flows. 60% from going further.</span> The first <strong>8 core flows</strong> (welcome series, abandoned cart, post-purchase, browse abandon, win-back, sunset, and a couple more) build your foundation linearly - each one adds predictable, meaningful revenue. But that only unlocks <strong>40% of what email can do</strong>. The other 60% is hidden revenue that 90% of brands never touch. Top performers keep building flows because that's where true retention lives: cross-sell sequences, upsell flows, different offers for non-buyers, segment-specific win-backs, re-engagement for lapsed customers. Email is uniquely suited for this because you can test different offers with different segments at near-zero cost - no ad spend, no risk.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Industry Performance Spectrum - Full Width */}
        <div className="mt-8 bg-[#0b0b16] rounded-xl border border-white/[0.08] p-7 sm:p-9">
          <h2 className="text-3xl font-bold text-white mb-2">
            🎯 Industry Performance Spectrum
          </h2>
          <p className="text-base text-gray-400 mb-8 max-w-[65ch]">
            Campaign revenue scales linearly up to {industry.best.campaigns}/month for most brands
          </p>

          <div className="space-y-5">
            {scenarioData.filter(s => s.key !== 'your').map((scenario) => {
              const accent =
                scenario.color === 'red' ? { dot: 'bg-red-500', panel: 'bg-red-950/25 border-red-900/40', rule: 'border-red-900/40', text: 'text-red-400' } :
                scenario.color === 'blue' ? { dot: 'bg-purple-500', panel: 'bg-purple-950/25 border-purple-900/40', rule: 'border-purple-900/40', text: 'text-purple-400' } :
                { dot: 'bg-green-500', panel: 'bg-green-950/25 border-green-900/40', rule: 'border-green-900/40', text: 'text-green-400' }
              const popup =
                scenario.key === 'typical' ? { lead: 'Pop-up conversion: 1-3%', body: 'Bad offer, poor design, wrong timing or targeting. Most list growth is slow and expensive. This is the single biggest lever being left untouched.' } :
                scenario.key === 'good' ? { lead: 'Pop-up conversion: ~5%', body: 'A good offer, clean design, and the basics set in place. List growth is consistent and campaigns have a healthy engaged audience to send to.' } :
                scenario.key === 'best' ? { lead: 'Pop-up conversion: 10-15% - non-negotiable.', body: 'This is the highest lever you have and the best testing ground for your offer. 10-15% pop-up conversions means higher list growth, a perfect offer/audience match, and more campaign and flow revenue on the bottom line. It all compounds from here - every percentage point increase feeds more subscribers into flows, boosts campaign list size, and amplifies everything downstream.' } :
                null

              return (
                <div key={scenario.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${accent.dot}`} />
                    <span className="text-base font-semibold text-gray-200">
                      {scenario.key === 'typical' ? '90% of Brands & Most Likely Your Current Setup' : scenario.label}
                    </span>
                  </div>

                  <div className={`rounded-lg border p-5 sm:p-6 ${accent.panel}`}>
                    {/* Headline numbers */}
                    <div className={`flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:gap-4 pb-5 border-b ${accent.rule}`}>
                      <div className="flex items-baseline justify-between sm:block">
                        <div className="text-xs text-gray-500 sm:mb-1">Revenue / mo</div>
                        <div className="text-lg font-bold text-white tabular-nums">
                          {formatCurrency(scenario.totalRevenue)}
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between sm:block">
                        <div className="text-xs text-gray-500 sm:mb-1">Net Profit / mo</div>
                        <div className="text-lg font-bold text-white tabular-nums">
                          {formatCurrency(scenario.netProfit)}
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between sm:block">
                        <div className="text-xs text-gray-500 sm:mb-1">ROI</div>
                        <div className="text-lg font-bold text-white tabular-nums">
                          {formatNumber(scenario.netROI, 1)}x
                        </div>
                      </div>
                    </div>

                    {/* Scannable facts */}
                    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 pt-5 text-sm">
                      <li className="flex items-start gap-2.5 text-gray-300">
                        <span className={`mt-[0.45rem] w-1 h-1 rounded-full shrink-0 ${accent.dot}`} />
                        <span><span className="font-semibold text-white tabular-nums">{scenario.campaigns}</span> campaigns per month</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-gray-300">
                        <span className={`mt-[0.45rem] w-1 h-1 rounded-full shrink-0 ${accent.dot}`} />
                        <span><span className="font-semibold text-white tabular-nums">{scenario.flows}</span> flows</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-gray-300">
                        <span className={`mt-[0.45rem] w-1 h-1 rounded-full shrink-0 ${accent.dot}`} />
                        <span><span className="font-semibold text-white tabular-nums">{formatNumber(scenario.emailPercent, 1)}%</span> of total revenue from email</span>
                      </li>
                      {popup && (
                        <li className="flex items-start gap-2.5 text-gray-300">
                          <span className={`mt-[0.45rem] w-1 h-1 rounded-full shrink-0 ${accent.dot}`} />
                          <span className={`font-semibold ${accent.text}`}>{popup.lead}</span>
                        </li>
                      )}
                    </ul>

                    {popup && (
                      <p className={`mt-5 pt-5 border-t text-sm text-gray-400 leading-relaxed max-w-[65ch] ${accent.rule}`}>
                        {popup.body}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-10 pt-8 border-t border-white/[0.08]">
            <div className="font-bold text-purple-300 mb-4 text-2xl">💡 Opportunity Analysis</div>

            <div className="space-y-3 mb-5">
              <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <div className="text-base text-gray-300">
                    <span className="font-semibold text-red-400">90% of Brands</span> → <span className="font-semibold text-purple-400">Good Performance</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      +{formatCurrency((scenarioData[2].netProfit - scenarioData[0].netProfit) * 12)}
                    </div>
                    <div className="text-sm text-gray-500">you're missing out on an annual profit gain</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.08]">
                <div className="flex justify-between items-center">
                  <div className="text-base text-gray-300">
                    <span className="font-semibold text-red-400">90% of Brands</span> → <span className="font-semibold text-green-400">Best-in-Class (Top 1%)</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">
                      +{formatCurrency((scenarioData[3].netProfit - scenarioData[0].netProfit) * 12)}
                    </div>
                    <div className="text-sm text-gray-500">you're missing out on a total opportunity</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mars Copywriting Timeline */}
            <div className="bg-gradient-to-r from-purple-900 to-violet-900 border border-purple-700/40 rounded-lg p-6 text-white mt-4">
              <div className="font-bold text-2xl mb-5">🚀 Mars Copywriting Timeline</div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-sm whitespace-nowrap">14 Days</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">Initial Setup Complete</div>
                    <div className="text-white/90 text-base mt-1 max-w-[62ch]">
                      Copywriting → Design → Your Approval. All deliverables implemented.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-sm whitespace-nowrap">1-2 Months</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">Good Performance Level</div>
                    <div className="text-white/90 text-base mt-1 max-w-[62ch]">
                      Optimized campaigns, core flows dialed in, revenue accelerating.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-sm whitespace-nowrap">3-6 Months</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">Best-in-Class (Top 1%)</div>
                    <div className="text-white/90 text-base mt-1 max-w-[62ch]">
                      Advanced segmentation, full flow suite, maximized email revenue.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Line - Full Width */}
        <div className="mt-6 bg-gradient-to-br from-purple-900 to-violet-950 rounded-xl border border-purple-700/40 p-6 sm:p-10 text-white glow-purple-sm">
          <h3 className="text-2xl sm:text-3xl font-bold mb-5">✅ Bottom Line</h3>
          <p className="leading-relaxed text-xl sm:text-2xl font-semibold max-w-[38ch]">
            Your email could be generating between{' '}
            <span className="font-extrabold text-2xl sm:text-4xl tabular-nums">{formatCurrency(scenarioData[2].netProfit)}</span>
            {' '}and{' '}
            <span className="font-extrabold text-2xl sm:text-4xl tabular-nums">{formatCurrency(scenarioData[3].netProfit)}</span>
            {' '}in monthly profit - a {formatNumber(scenarioData[2].netROI, 1)}x to {formatNumber(scenarioData[3].netROI, 1)}x net ROI.
          </p>
          <div className="mt-6 space-y-4 text-base sm:text-xl text-white/90 leading-relaxed max-w-[62ch]">
            <p>
              If you're sending just {industry.typical.campaigns} campaigns per month, you're missing out on{' '}
              <span className="font-bold text-white">{formatCurrency(scenarioData[2].netProfit - scenarioData[0].netProfit)} every single month</span>{' '}
              in profit - that's{' '}
              <span className="font-bold text-white">{formatCurrency((scenarioData[2].netProfit - scenarioData[0].netProfit) * 12)} per year</span>{' '}
              in unrealized revenue just by not being at Good Performance. Your list, your flows, your existing traffic - all of it sitting underutilized.
            </p>
            <p>
              If you reached Best-in-Class ({industry.best.campaigns} campaigns/month + {industry.best.flows} flows + 10-15% pop-up conversion), you would capture{' '}
              <span className="font-bold text-white">{formatCurrency(scenarioData[3].netProfit - scenarioData[0].netProfit)} more in monthly profit</span>{' '}
              - a{' '}
              <span className="font-bold text-white">{formatCurrency((scenarioData[3].netProfit - scenarioData[0].netProfit) * 12)} annual difference</span>{' '}
              from the exact same email list. The only variable is how many campaigns you send per week, how many flows you build, and whether your pop-up is converting at 10-15%. That last one compounds into everything - more subscribers, bigger lists, higher flow revenue. It all starts there.
            </p>
          </div>
        </div>

        {/* Per $1 Invested Callout */}
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0b0b16] p-8 text-center">
          <p className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Your Email ROI</p>
          <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-[44ch] mx-auto">
            For every{' '}
            <span className="font-bold text-white">$1</span>
            {' '}invested in email marketing, you get back{' '}
            <span className="font-extrabold text-2xl sm:text-3xl text-purple-300 tabular-nums">
              ${formatNumber(scenarioData[2].netROI, 2)}
            </span>
            {' '}–{' '}
            <span className="font-extrabold text-2xl sm:text-3xl text-purple-300 tabular-nums">
              ${formatNumber(scenarioData[3].netROI, 2)}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-3">Based on Good Performance → Best-in-Class net ROI range for your inputs</p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Based on Klaviyo benchmarks from 325B+ emails • RPR = Revenue Per Recipient</p>
          <p className="mt-2">Profit ROI accounts for gross margins. Revenue ROI is typically 4-5x higher.</p>
        </div>
      </div>
    </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="bg-[#08080f] py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-4">Ready to grow?</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Let's turn your email list<br className="hidden sm:block" /> into your #1 revenue channel.
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            No fluff, no retainer lock-ins on day one. Just a straightforward conversation about where your email is right now and what's possible in 90 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/jacobjakobi/strategy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 text-lg"
            >
              Book a Free Strategy Call
            </a>
            <a
              href="#calculator"
              className="inline-flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 text-lg"
            >
              Run the Numbers First
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-600">No commitment required. 30-minute call. Real answers.</p>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#08080f] border-t border-white/[0.08] px-6 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Main footer row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 mb-6">
            <div className="font-bold text-white text-lg tracking-tight">Mars Copywriting</div>
            <nav className="flex items-center gap-8">
              <a href="#services" className="text-sm text-gray-500 hover:text-white transition-colors">Services</a>
              <a href="#results" className="text-sm text-gray-500 hover:text-white transition-colors">Results</a>
              <a href="#reviews" className="text-sm text-gray-500 hover:text-white transition-colors">Reviews</a>
              <a href="#calculator" className="text-sm text-gray-500 hover:text-white transition-colors">ROI Calculator</a>
            </nav>
            <div className="text-sm text-gray-600">© 2026 Mars Copywriting</div>
          </div>
          {/* Legal row */}
          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
              Mars Copywriting j.d.o.o. is registered at Topoljska ulica 15B, 10255, Donji Stupnik, Croatia. Company director: Jakov Maršić. Active since 30 January 2024.
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <a href="/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy Policy</a>
              <span className="text-gray-700 text-xs">·</span>
              <a href="/refund-cancellation" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Refund &amp; Cancellation Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
