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

type LightboxState = { items: string[]; folder: string; index: number; alt: string }

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
        onOpen={(index) => setLightbox({ items: images.klaviyo, folder: 'klaviyo', index, alt: 'Klaviyo results' })}
      />
      <MosaicMarquee
        items={images.slack}
        folder="slack"
        label="What Clients Say"
        direction="right"
        alt="Client feedback"
        onOpen={(index) => setLightbox({ items: images.slack, folder: 'slack', index, alt: 'Client feedback' })}
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
  const offsetRef = useRef(0)
  const distanceRef = useRef(0)
  const speedRef = useRef(0)
  const targetRef = useRef(0)

  const BASE_SPEED = 40 // px/sec at rest
  const HOVER_SPEED = 10 // px/sec while hovered (slows, never stops)

  useEffect(() => {
    if (!items.length) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dirSign = direction === 'left' ? 1 : -1
    targetRef.current = reduce ? 0 : BASE_SPEED
    speedRef.current = reduce ? 0 : BASE_SPEED

    const panel = panelRef.current
    const measure = () => {
      if (!panel) return
      const parent = panel.parentElement
      const gap = parent ? parseFloat(getComputedStyle(parent).columnGap || '0') || 0 : 0
      distanceRef.current = panel.offsetWidth + gap
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (panel) ro.observe(panel)

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      speedRef.current += (targetRef.current - speedRef.current) * Math.min(dt * 6, 1)
      const d = distanceRef.current
      if (d > 0) {
        offsetRef.current = ((offsetRef.current + dirSign * speedRef.current * dt) % d + d) % d
        if (trackRef.current) trackRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
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
          <img src={`/images/proof/${folder}/${img}`} alt={alt} loading="lazy" decoding="async" />
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <p className="text-xs font-semibold text-purple-400 uppercase tracking-[0.2em] mb-5 text-center">{label}</p>
      <div className="overflow-hidden carousel-mask" onMouseEnter={slow} onMouseLeave={resume}>
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
  folder,
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
        src={`/images/proof/${folder}/${items[index]}`}
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
            <a href="#services" className="text-sm text-gray-400 hover:text-white transition-colors">Services</a>
            <a href="#results" className="text-sm text-gray-400 hover:text-white transition-colors">Results</a>
            <a href="#reviews" className="text-sm text-gray-400 hover:text-white transition-colors">Reviews</a>
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
            {/* CLIENT LOGIN — replace href with your actual client portal URL */}
            <a
              href="#"
              className="text-sm text-white bg-purple-600 hover:bg-purple-500 font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            >
              Client Login
            </a>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section id="hero" className="hero-bg pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center w-full">
          {/* Pill tag */}
          <div className="inline-flex items-center gap-2 bg-purple-950/60 border border-purple-700/40 rounded-full px-4 py-1.5 text-sm text-purple-300 font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Flows &nbsp;·&nbsp; Campaigns &nbsp;·&nbsp; Broadcasts
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight glow-text-purple mb-3">
            Full Stack Email Copywriter with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">
              $8.5M in Sales
            </span>{' '}
            for 8-9 Figure DTC Brands
          </h1>

          {/* Subheadline */}
          <p className="text-base text-gray-400 mb-6 max-w-2xl mx-auto">
            Klaviyo emails for wellness, beauty, luxury, health, supplements, and fitness brands.
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
          <div className="grid grid-cols-3 gap-0 divide-x divide-purple-900/30">
            {[
              { stat: '$8.5M+', label: 'Revenue driven for clients' },
              { stat: '1,025%', label: 'Highest single brand revenue increase' },
              { stat: '+112% YoY', label: 'Fastest brand growth' },
            ].map((item, i) => (
              <div key={i} className="text-center px-8 py-4">
                <div className="text-4xl font-extrabold text-white mb-2 glow-text-purple">{item.stat}</div>
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
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-10">
            {['NOTUS', 'BITGET', 'ECOM ADVERTISERS', 'BRAND LUX MEDIA'].map((name) => (
              <span key={name} className="text-sm font-bold tracking-widest text-gray-600 hover:text-gray-400 transition-colors uppercase">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FIT SECTION ==================== */}
      <section id="fit" className="bg-[#08080f] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Is This Right For You?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Good fit */}
            <div className="card-dark rounded-2xl p-8 border-green-800/40 hover:border-green-700/60 transition-colors" style={{border: '1px solid rgba(22, 101, 52, 0.4)'}}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-green-400 text-lg">Good fit if...</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "You're an ecommerce brand doing $50K-$500K+/month",
                  "You're in wellness, beauty, luxury, health, supplements, or fitness",
                  "You use Klaviyo or are open to switching",
                  "You want more email revenue without discounting your margins",
                  "You're sending fewer than 8 campaigns/month or have under 8 active flows",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Not a fit */}
            <div className="card-dark rounded-2xl p-8" style={{border: '1px solid rgba(153, 27, 27, 0.4)'}}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="font-bold text-red-400 text-lg">Not a fit if...</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "You're not running an ecommerce store",
                  "You want cheap, templated batch-and-blast emails",
                  "You need someone to run paid ads",
                  "You're not open to testing and iterating on copy",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="mt-0.5 text-red-500 shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== WHAT WE DO ==================== */}
      <section id="services" className="bg-[#0d0d18] py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What We Do</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">End-to-end email marketing for ecommerce brands that want revenue without burning margins on discounts.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* ==================== CASE STUDIES ==================== */}
      <section id="results" className="bg-[#08080f] py-24 px-6 border-t border-white/5">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Real Results From Real Brands</h2>
            <p className="text-gray-500">What happens when email is done right.</p>
          </div>

          {/* ===== Flagship case studies ===== */}
          <div className="max-w-3xl mx-auto space-y-8 mb-16">
            {[
              {
                brand: 'PATCHED',
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
              <div key={i} className="relative overflow-hidden rounded-2xl border border-purple-900/40 bg-gradient-to-br from-[#17102e] via-[#0d0d1a] to-[#08080f] p-7 md:p-10">
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
                  <div className="rounded-xl bg-white/5 border border-white/8 p-5 md:p-6">
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
                  <a
                    href={cs.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-7 inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(124,58,237,0.35)] transition-all duration-200 hover:from-purple-500 hover:to-violet-500 hover:shadow-[0_0_45px_rgba(124,58,237,0.55)]"
                  >
                    {cs.cta}
                    <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <SocialProofCarousels />

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">

            {/* Case Study 1 */}
            <div className="card-dark rounded-2xl overflow-hidden">
              <div className="bg-green-900/20 px-6 py-3 flex items-center gap-3 border-b border-green-800/30">
                <span className="bg-green-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</span>
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
                <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">What We Did</div>
                  <p className="text-gray-400 text-sm leading-relaxed">Monthly calendar approved one week before each month. Mix of plain-text and design emails, YouTube videos repurposed into value-based content, zero discounts to protect margins.</p>
                </div>
              </div>
            </div>

            {/* Case Study 2 */}
            <div className="card-dark rounded-2xl overflow-hidden">
              <div className="bg-green-900/20 px-6 py-3 flex items-center gap-3 border-b border-green-800/30">
                <span className="bg-green-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</span>
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
                <div className="bg-white/5 rounded-xl p-4 border border-white/8">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">What We Did</div>
                  <p className="text-gray-400 text-sm leading-relaxed">They were sending zero emails. We started at 4/week, got them out of spam and into primary inboxes - and they started generating revenue right in time for BFCM.</p>
                </div>
              </div>
            </div>

            {/* Case Study 3 - Combined */}
            <div className="card-dark rounded-2xl overflow-hidden">
              <div className="bg-green-900/20 px-6 py-3 flex items-center gap-3 border-b border-green-800/30">
                <span className="bg-green-600 text-white font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</span>
                <span className="text-white font-semibold">Supplement Brand - Copy & Conversion Testing</span>
                <span className="ml-auto text-green-400 text-xs">21% higher CVR + 8.72% pop-up</span>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Plain Text vs Design Email</div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/8">
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
              { quote: "Jacob is an incredible email marketer and copywriter... his work ethic and skillset is top 5%.", name: "Daniel Filipe", title: "Founder, Ecom Advertisers - 7-Figure Email Agency" },
              { quote: "Jacob is an absolute pleasure to work with... he delivers fantastic copywriting work. We worked on multiple projects together and he hasn't disappointed once.", name: "Marvin Sanginés", title: "Founder, notus - 7-Figure Personal Branding Agency" },
              { quote: "Jacob wrote weeks of copy in advance and with his help we keep making more money for our clients. One client told us he's getting his best month of the year so far. Jacob is easy to talk to, works fast and always delivers.", name: "Brando Monetti", title: "CEO, Brand Lux Media" },
              { quote: "He doesn't stop until he has every answer and angle he needs to get customers turning heads buying your products. Definitely someone you can grab a beer with and vibe while knowing you're making money together.", name: "Mason Doerr", title: "Founder, CopyMBA" },
              { quote: "Jacob's got a great instinct for finding a way to sell the unsellable.", name: "Thom Benny", title: "7-Figure Financial Copywriter for Agora (Billion Dollar Publisher)" },
            ].map((t, i) => (
              <div key={i} className="card-dark rounded-2xl p-6">
                <div className="text-yellow-400 text-xl mb-3 tracking-wider">★★★★★</div>
                <p className="text-gray-300 italic leading-relaxed mb-5">"{t.quote}"</p>
                <div className="border-t border-white/10 pt-4">
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="bg-[#08080f] py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you need to know before booking a call.</p>
          </div>
          <div className="divide-y divide-white/8">
            {[
              {
                q: 'How is Mars Copywriting different from an agency?',
                a: "We don't view ourselves as an agency. We act as an in-house extension of your team so you don't have to fully hand over control of your brand. We communicate daily and take care of every email operation — strategy, copy, Klaviyo management — without you chasing a project manager every week.",
              },
              {
                q: 'What services do you offer?',
                a: 'Full-service Klaviyo email marketing: campaign copywriting, flow automation, pop-up form optimization, monthly content calendars, list segmentation, and deliverability management. You provide brand assets. We handle everything else.',
              },
              {
                q: 'How often will you send campaigns to my list?',
                a: "Typically 3–4 campaigns per week to your engaged segment. We adjust based on your list health, seasonal calendar, and revenue goals — more during BFCM, less when needed to protect deliverability.",
              },
              {
                q: 'What does it cost?',
                a: 'We work on a flat monthly retainer. Our clients typically invest between $4K–$6K/month depending on project scope. No lock-in contracts on day one — we start with a 60-day pilot and go from there. Book a call to get an exact number for your brand.',
              },
            ].map((item, i) => (
              <div key={i} className="py-6">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left gap-6"
                >
                  <span className="text-lg font-semibold text-white">{item.q}</span>
                  <svg
                    className={`w-6 h-6 text-green-500 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <p className="mt-4 text-gray-400 leading-relaxed">{item.a}</p>
                )}
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
    <section id="calculator" className={`bg-[#08080f] py-20 px-6 border-t border-white/5 ${prospectSlug && activeSection !== 'calculator' ? 'hidden' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-white mb-3">
            Email Marketing ROI Calculator
            {prospectSlug && <span className="text-purple-400"> — {prospectName}</span>}
          </h2>
          <p className="text-gray-400 text-lg">
            See where you stand vs industry benchmarks · Based on Klaviyo data from 325B+ emails
          </p>
        </div>
        {/* Dark container wrapping all calculator content */}
        <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-br from-[#0d0d1a] to-[#080810] p-8 shadow-2xl max-h-[82vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800 scrollbar-track-transparent">

        {/* Industry Selector */}
        <div className="bg-[#0d0d1a] rounded-xl border border-purple-900/30 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">📊 Select Your Industry</h2>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value as keyof typeof INDUSTRY_BENCHMARKS)}
            className="w-full px-4 py-3 bg-[#080810] border border-purple-800/40 text-white rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => (
              <option key={key} value={key} className="bg-[#0d0d1a]">{data.name}</option>
            ))}
          </select>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-purple-950/40 rounded-lg p-3 border border-purple-800/20">
              <div className="text-purple-400 font-medium">Campaign RPR</div>
              <div className="text-2xl font-bold text-white">${formatNumber(industry.campaignRPR, 3)}</div>
              <div className="text-purple-400 text-xs">per recipient</div>
            </div>
            <div className="bg-violet-950/40 rounded-lg p-3 border border-violet-800/20">
              <div className="text-violet-400 font-medium">Flow RPR</div>
              <div className="text-2xl font-bold text-white">${formatNumber(industry.flowRPR, 2)}</div>
              <div className="text-violet-400 text-xs">per recipient</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Inputs */}
          <div className="space-y-6">
            {/* Business Inputs */}
            <div className="bg-[#0d0d1a] rounded-xl border border-purple-900/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">💼 Your Business</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email List Size: {emailListSize.toLocaleString()} profiles
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="500000"
                    step="500"
                    value={emailListSize}
                    onChange={(e) => setEmailListSize(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>500</span>
                    <span>500k</span>
                  </div>
                  <div className="mt-2 text-sm text-purple-400">
                    Klaviyo Cost: {formatCurrency(klaviyoCost)}/month
                  </div>
                  <div className="mt-3 bg-amber-950/30 border border-amber-700/30 rounded-lg p-3">
                    <div className="text-xs font-semibold text-amber-300 mb-1">📊 Engaged List Size</div>
                    <div className="text-lg font-bold text-amber-200">{engagedListSize.toLocaleString()} profiles (40%)</div>
                    <div className="text-xs text-amber-400/80 mt-1">
                      Your "true" list size is typically 30-40% of your total list. This is your engaged segment
                      (90-240 day active subscribers) and is what we use for all revenue calculations.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Monthly Revenue
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">$</span>
                    <input
                      type="number"
                      value={totalMonthlyRevenue}
                      onChange={(e) => setTotalMonthlyRevenue(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 bg-[#080810] border border-purple-800/40 text-white rounded-lg"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Annual: {formatCurrency(calculations.annualRevenue)}
                    <span className="ml-2 font-semibold text-purple-400">
                      ({calculations.annualRevenue < 1000000 ? '$0-1M' : calculations.annualRevenue < 5000000 ? '$1M-5M' : '$5M-20M'} bracket)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Average Order Value (AOV): {formatCurrency(averageOrderValue)}
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="5"
                    value={averageOrderValue}
                    onChange={(e) => setAverageOrderValue(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>$20</span>
                    <span>$300</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gross Profit Margin: {grossMargin}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={grossMargin}
                    onChange={(e) => setGrossMargin(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>20%</span>
                    <span>90%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Traffic & Pop-up Performance */}
            <div className="bg-[#0d0d1a] rounded-xl border border-purple-900/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">🌐 Website Traffic & Pop-up</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Website Visitors: {monthlyTraffic.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="500000"
                    step="1000"
                    value={monthlyTraffic}
                    onChange={(e) => setMonthlyTraffic(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1k</span>
                    <span>500k</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pop-up Conversion Rate: {popupConversionRate.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={popupConversionRate}
                    onChange={(e) => setPopupConversionRate(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div className="bg-purple-950/40 border border-purple-700/40 rounded-lg p-4">
                  <div className="text-sm font-semibold text-purple-300 mb-2">
                    📊 New Subscribers Per Month
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {calculations.newSubscribersPerMonth.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-400 mt-2">
                    These {calculations.newSubscribersPerMonth.toLocaleString()} new subscribers enter your flows each month.
                    <br/>
                    <span className="font-semibold text-purple-300">Without traffic, there is no flow revenue.</span>
                  </div>
                </div>

                <div className="bg-violet-950/40 border border-violet-800/30 rounded-lg p-3">
                  <div className="text-xs text-violet-300">
                    <span className="font-semibold">💡 Pop-up Benchmarks:</span>
                    <br/>• 1-3%: Typical (most brands)
                    <br/>• 5-8%: Good performance
                    <br/>• 10%+: Excellent (good offer/audience match)
                  </div>
                </div>

                {calculations.campaignMultiplier > 1 && (
                  <div className="bg-green-950/40 border border-green-800/30 rounded-lg p-3">
                    <div className="text-xs text-green-300">
                      <span className="font-semibold">🔥 Campaign Multiplier Active:</span>
                      <br/>Your {campaignsPerMonth} campaigns/month are boosting flow revenue by{' '}
                      <span className="font-bold">{((calculations.campaignMultiplier - 1) * 100).toFixed(1)}%</span>
                      <br/>(More campaigns = more people re-triggering flows)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Email Strategy */}
            <div className="bg-[#0d0d1a] rounded-xl border border-purple-900/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">📧 Your Email Strategy</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaigns per Month: {campaignsPerMonth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={campaignsPerMonth}
                    onChange={(e) => setCampaignsPerMonth(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1</span>
                    <span>30</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Active Flows: {numberOfFlows}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={numberOfFlows}
                    onChange={(e) => setNumberOfFlows(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Retainer: {formatCurrency(monthlyRetainer)}
                  </label>
                  <input
                    type="range"
                    min="2000"
                    max="10000"
                    step="500"
                    value={monthlyRetainer}
                    onChange={(e) => setMonthlyRetainer(Number(e.target.value))}
                    className="w-full h-2 bg-purple-900/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>$2k</span>
                    <span>$10k</span>
                  </div>
                </div>

                {/* Manual Overrides */}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">🎯 Manual Overrides (Optional)</h3>

                  <div className="space-y-3">
                    <div>
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
                        <label htmlFor="manualCampaign" className="text-sm font-medium text-gray-300">
                          Set Average Campaign Revenue
                        </label>
                      </div>
                      {useManualCampaignRev && (
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-400">$</span>
                          <input
                            type="number"
                            value={manualAvgCampaignRev}
                            onChange={(e) => setManualAvgCampaignRev(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2 bg-[#080810] border border-purple-800/40 text-white rounded-lg"
                            placeholder={`Default: ${formatCurrency(calculations.avgCampaignRev)}`}
                          />
                        </div>
                      )}
                      {!useManualCampaignRev && (
                        <div className="text-xs text-gray-600 ml-6">
                          Default: {formatCurrency(industry.campaignRPR * engagedListSize)} per campaign
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {/* Current Performance */}
            <div className="bg-gradient-to-br from-purple-900 to-violet-950 rounded-xl border border-purple-700/40 p-6 text-white glow-purple-sm">
              <h2 className="text-2xl font-bold mb-6">📈 Your Current Performance (Monthly)</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
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
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur col-span-2">
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
                      <div className="flex rounded-lg overflow-hidden h-8 mb-2" style={{ gap: '2px' }}>
                        <div
                          className="bg-white/20 flex items-center justify-center text-xs font-semibold overflow-hidden whitespace-nowrap px-2 shrink-0"
                          style={{ width: `${Math.max(baseW, 18)}%` }}
                        >
                          Base {formatNumber(baseW, 0)}%
                        </div>
                        <div
                          className="flex-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-300 flex items-center justify-center text-xs font-bold text-emerald-900 overflow-hidden whitespace-nowrap px-2"
                        >
                          +{formatCurrency(calculations.incrementalEmailRevenue)} email&nbsp;·&nbsp;{formatNumber(calculations.emailAttributedPercent, 1)}% of total*
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex justify-between text-xs opacity-70 mt-1">
                    <span>Business base: {formatCurrency(totalMonthlyRevenue)}</span>
                    <span>Klaviyo gross: {formatCurrency(calculations.totalEmailRevenue)}</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-sm opacity-90 mb-1">Total Costs</div>
                  <div className="text-2xl font-bold">{formatCurrency(calculations.totalEmailCost)}</div>
                  <div className="text-xs opacity-75 mt-1">retainer + Klaviyo</div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                  <div className="text-sm opacity-90 mb-1">Gross ROI</div>
                  <div className="text-2xl font-bold">{formatNumber(calculations.grossROI, 1)}x</div>
                  <div className="text-xs opacity-75 mt-1">revenue</div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur col-span-2">
                  <div className="text-sm opacity-90 mb-1">Net Profit from Email</div>
                  <div className="text-3xl font-bold">{formatCurrency(calculations.netProfitFromEmail)}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {formatNumber(calculations.netROI, 1)}x net ROI (profit-based)
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Revenue Chart */}
            <div className="bg-[#0d0d1a] rounded-xl border border-purple-900/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                📈 Campaign Volume vs Revenue
              </h2>
              {(() => {
                const PAD_L = 68, PAD_R = 14, PAD_T = 46, PAD_B = 36
                const W = 440, H = 240
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
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '260px' }}>
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
                )
              })()}
              <div className="bg-purple-950/40 border border-purple-700/30 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-purple-400">Two performance peaks:</span> Most brands hit a first revenue peak at <strong className="text-white">10–12 campaigns/month</strong> - the sweet spot for list health and engagement. Brands that invest in segmentation and offer testing unlock a <strong className="text-white">second, higher peak at 20–25/month</strong>. Beyond 25, more volume yields diminishing returns; the strategy shifts to targeting fresh segments with new offers, not just higher frequency.
                </p>
              </div>
            </div>

            {/* Flow Revenue Chart */}
            <div className="bg-[#0d0d1a] rounded-xl border border-purple-900/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                ⚙️ Flow Count vs Revenue
              </h2>
              {(() => {
                const PAD_L = 68, PAD_R = 14, PAD_T = 36, PAD_B = 36
                const W = 440, H = 240
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
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '260px' }}>
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
                )
              })()}
              <div className="bg-violet-950/40 border border-violet-700/30 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-violet-400">40% from the first 8 flows. 60% from going further.</span> The first <strong>8 core flows</strong> (welcome series, abandoned cart, post-purchase, browse abandon, win-back, sunset, and a couple more) build your foundation linearly - each one adds predictable, meaningful revenue. But that only unlocks <strong>40% of what email can do</strong>. The other 60% is hidden revenue that 90% of brands never touch. Top performers keep building flows because that's where true retention lives: cross-sell sequences, upsell flows, different offers for non-buyers, segment-specific win-backs, re-engagement for lapsed customers. Email is uniquely suited for this because you can test different offers with different segments at near-zero cost - no ad spend, no risk.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Industry Performance Spectrum - Full Width */}
        <div className="mt-8 bg-[#0d0d1a] rounded-xl border border-purple-900/30 p-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            🎯 Industry Performance Spectrum
          </h2>
          <p className="text-base text-gray-400 mb-8">
            Campaign revenue scales linearly up to {industry.best.campaigns}/month for most brands
          </p>

          <div className="space-y-5">
            {scenarioData.filter(s => s.key !== 'your').map((scenario) => (
              <div key={scenario.key} className="relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      scenario.color === 'red' ? 'bg-red-500' :
                      scenario.color === 'blue' ? 'bg-purple-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-base font-semibold text-gray-200">
                      {scenario.key === 'typical' ? '90% of Brands & Most Likely Your Current Setup' : scenario.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {scenario.campaigns} campaigns per month - {scenario.flows} flows
                  </span>
                </div>

                <div className={`rounded-lg p-5 ${
                  scenario.color === 'red' ? 'bg-red-950/30 border border-red-800/40' :
                  scenario.color === 'blue' ? 'bg-purple-950/30 border border-purple-800/40' :
                  'bg-green-950/30 border border-green-800/40'
                }`}>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Revenue / mo</div>
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(scenario.totalRevenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Net Profit / mo</div>
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(scenario.netProfit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">ROI</div>
                      <div className="text-lg font-bold text-white">
                        {formatNumber(scenario.netROI, 1)}x
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {formatNumber(scenario.emailPercent, 1)}% of total revenue from email
                  </div>
                  {/* Pop-up conversion rate context */}
                  <div className={`mt-3 pt-3 border-t text-sm ${
                    scenario.color === 'red' ? 'border-red-900/40 text-red-400' :
                    scenario.color === 'blue' ? 'border-purple-900/40 text-purple-400' :
                    'border-green-900/40 text-green-400'
                  }`}>
                    {scenario.key === 'typical' && (
                      <>
                        <span className="font-semibold">Pop-up conversion: 1-3%</span>
                        {' '}- Bad offer, poor design, wrong timing or targeting. Most list growth is slow and expensive. This is the single biggest lever being left untouched.
                      </>
                    )}
                    {scenario.key === 'good' && (
                      <>
                        <span className="font-semibold">Pop-up conversion: ~5%</span>
                        {' '}- A good offer, clean design, and the basics set in place. List growth is consistent and campaigns have a healthy engaged audience to send to.
                      </>
                    )}
                    {scenario.key === 'best' && (
                      <>
                        <span className="font-semibold">Pop-up conversion: 10-15% - non-negotiable.</span>
                        {' '}This is the highest lever you have and the best testing ground for your offer. 10-15% pop-up conversions means higher list growth, a perfect offer/audience match, and more campaign and flow revenue on the bottom line. It all compounds from here - every percentage point increase feeds more subscribers into flows, boosts campaign list size, and amplifies everything downstream.
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-purple-950/30 border border-purple-800/40 rounded-lg p-6">
            <div className="font-bold text-purple-300 mb-4 text-2xl">💡 Opportunity Analysis</div>

            <div className="space-y-3 mb-5">
              <div className="bg-white/5 rounded-lg p-4 border border-purple-800/30">
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

              <div className="bg-white/5 rounded-lg p-4 border border-purple-800/30">
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
                    <div className="text-white/90 text-base mt-1">
                      Copywriting → Design → Your Approval. All deliverables implemented.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-sm whitespace-nowrap">1-2 Months</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">Good Performance Level</div>
                    <div className="text-white/90 text-base mt-1">
                      Optimized campaigns, core flows dialed in, revenue accelerating.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-sm whitespace-nowrap">3-6 Months</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">Best-in-Class (Top 1%)</div>
                    <div className="text-white/90 text-base mt-1">
                      Advanced segmentation, full flow suite, maximized email revenue.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Line - Full Width */}
        <div className="mt-6 bg-gradient-to-br from-purple-900 to-violet-950 rounded-xl border border-purple-700/40 p-10 text-white glow-purple-sm">
          <h3 className="text-3xl font-bold mb-5">✅ Bottom Line</h3>
          <p className="leading-relaxed text-2xl font-semibold">
            Your email could be generating between{' '}
            <span className="font-extrabold text-4xl">{formatCurrency(scenarioData[2].netProfit)}</span>
            {' '}and{' '}
            <span className="font-extrabold text-4xl">{formatCurrency(scenarioData[3].netProfit)}</span>
            {' '}in monthly profit - a {formatNumber(scenarioData[2].netROI, 1)}x to {formatNumber(scenarioData[3].netROI, 1)}x net ROI.
          </p>
          <div className="mt-6 space-y-4 text-xl text-white/90 leading-relaxed">
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
        <div className="mt-6 rounded-xl border border-purple-700/30 bg-[#0d0d1a] p-8 text-center">
          <p className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Your Email ROI</p>
          <p className="text-2xl text-gray-300 leading-relaxed">
            For every{' '}
            <span className="font-bold text-white">$1</span>
            {' '}invested in email marketing, you get back{' '}
            <span className="font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">
              ${formatNumber(scenarioData[2].netROI, 2)}
            </span>
            {' '}–{' '}
            <span className="font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">
              ${formatNumber(scenarioData[3].netROI, 2)}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-3">Based on Good Performance → Best-in-Class net ROI range for your inputs</p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Based on Klaviyo benchmarks from 325B+ emails • RPR = Revenue Per Recipient</p>
          <p className="mt-2">Profit ROI accounts for gross margins. Revenue ROI is typically 4-5x higher.</p>
          <p className="mt-3 text-xs text-gray-600 max-w-2xl mx-auto leading-relaxed">
            * <strong>Last-touch attribution note:</strong> Klaviyo attributes a purchase to email whenever a customer clicks
            an email within the attribution window - even if they would have purchased without it. Approximately 20% of
            Klaviyo-reported email revenue falls into this category (most commonly attributed to welcome flows, where a
            new customer was already intending to buy). The dashboard deducts this 20% and adds only the remaining 80%
            (truly incremental revenue) on top of your base business revenue to calculate the correct total and
            email-attributed percentage.
          </p>
        </div>
        </div>{/* end dark calculator container */}
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
      <footer className="bg-[#08080f] border-t border-white/8 px-6 pt-8 pb-6">
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
