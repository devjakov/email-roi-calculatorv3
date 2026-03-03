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

import { useState, useMemo } from 'react'

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
 * MAIN CALCULATOR COMPONENT
 * 
 * This component manages all state and calculations for the ROI calculator
 * Built with React hooks for reactive updates
 */
export default function Home() {
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
    
    // Email as % of total business revenue (capped at 100%)
    const emailPercentOfRevenue = Math.min((totalEmailRevenue / totalMonthlyRevenue) * 100, 100)
    
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
      emailPercentOfRevenue,
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
      
      const totalRev = campRev + flowRev
      const cost = monthlyRetainer + klaviyoCost
      const grossProf = totalRev * (grossMargin / 100)
      const netProf = grossProf - cost
      const netROI = netProf / cost
      const emailPercent = Math.min((totalRev / totalMonthlyRevenue) * 100, 100)

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
  const campaignChartData = useMemo(() => {
    const points = []
    const avgCampRev = industry.campaignRPR * engagedListSize
    for (let campaigns = 1; campaigns <= 30; campaigns++) {
      // Linear growth up to 15 campaigns, then plateau
      const growthFactor = campaigns <= 15 ? campaigns : 15 + (campaigns - 15) * 0.2
      const revenue = growthFactor * avgCampRev
      points.push({ campaigns, revenue })
    }
    return points
  }, [industry, engagedListSize])

  // Generate flow chart data
  const flowChartData = useMemo(() => {
    const points = []
    const flowRPRMonthly = industry.flowRPR * 0.015
    const maxFlowRevenue = 20 * flowRPRMonthly * engagedListSize // Max potential at 20 flows
    
    for (let flows = 1; flows <= 30; flows++) {
      // Steep growth for first 10 flows (50% of FLOW revenue), then diminishing returns
      let revenueFactor
      if (flows <= 10) {
        revenueFactor = flows / 20 // Gets to 50% at flow 10
      } else {
        // Diminishing returns after 10 flows
        const additionalFlows = flows - 10
        revenueFactor = 0.5 + (0.5 * (1 - Math.exp(-additionalFlows / 10)))
      }
      const revenue = revenueFactor * maxFlowRevenue
      points.push({ flows, revenue })
    }
    return points
  }, [industry, engagedListSize])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Email Marketing ROI Calculator
          </h1>
          <p className="text-lg text-gray-600">
            See where you stand vs industry benchmarks • Based on Klaviyo data from 325B+ emails
          </p>
        </div>

        {/* Industry Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Select Your Industry</h2>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value as keyof typeof INDUSTRY_BENCHMARKS)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => (
              <option key={key} value={key}>{data.name}</option>
            ))}
          </select>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-blue-600 font-medium">Campaign RPR</div>
              <div className="text-2xl font-bold text-blue-900">${formatNumber(industry.campaignRPR, 3)}</div>
              <div className="text-blue-600 text-xs">per recipient</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-purple-600 font-medium">Flow RPR</div>
              <div className="text-2xl font-bold text-purple-900">${formatNumber(industry.flowRPR, 2)}</div>
              <div className="text-purple-600 text-xs">per recipient</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Inputs */}
          <div className="space-y-6">
            {/* Business Inputs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">💼 Your Business</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email List Size: {emailListSize.toLocaleString()} profiles
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="500000"
                    step="500"
                    value={emailListSize}
                    onChange={(e) => setEmailListSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>500</span>
                    <span>500k</span>
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    Klaviyo Cost: {formatCurrency(klaviyoCost)}/month
                  </div>
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-yellow-900 mb-1">📊 Engaged List Size</div>
                    <div className="text-lg font-bold text-yellow-900">{engagedListSize.toLocaleString()} profiles (40%)</div>
                    <div className="text-xs text-yellow-700 mt-1">
                      Your "true" list size is typically 30-40% of your total list. This is your engaged segment 
                      (90-240 day active subscribers) and is what we use for all revenue calculations.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Monthly Revenue
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={totalMonthlyRevenue}
                      onChange={(e) => setTotalMonthlyRevenue(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Annual: {formatCurrency(calculations.annualRevenue)}
                    <span className="ml-2 font-semibold text-blue-600">
                      ({calculations.annualRevenue < 1000000 ? '$0-1M' : calculations.annualRevenue < 5000000 ? '$1M-5M' : '$5M-20M'} bracket)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average Order Value (AOV): {formatCurrency(averageOrderValue)}
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="5"
                    value={averageOrderValue}
                    onChange={(e) => setAverageOrderValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$20</span>
                    <span>$300</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gross Profit Margin: {grossMargin}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={grossMargin}
                    onChange={(e) => setGrossMargin(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20%</span>
                    <span>90%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Traffic & Pop-up Performance */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🌐 Website Traffic & Pop-up</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Website Visitors: {monthlyTraffic.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="500000"
                    step="1000"
                    value={monthlyTraffic}
                    onChange={(e) => setMonthlyTraffic(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1k</span>
                    <span>500k</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pop-up Conversion Rate: {popupConversionRate.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={popupConversionRate}
                    onChange={(e) => setPopupConversionRate(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-blue-900 mb-2">
                    📊 New Subscribers Per Month
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    {calculations.newSubscribersPerMonth.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    These {calculations.newSubscribersPerMonth.toLocaleString()} new subscribers enter your flows each month.
                    <br/>
                    <span className="font-semibold">Without traffic, there is no flow revenue.</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-xs text-purple-900">
                    <span className="font-semibold">💡 Pop-up Benchmarks:</span>
                    <br/>• 1-3%: Typical (most brands)
                    <br/>• 5-8%: Good performance
                    <br/>• 10%+: Excellent (good offer/audience match)
                  </div>
                </div>

                {calculations.campaignMultiplier > 1 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xs text-green-900">
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Your Email Strategy</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaigns per Month: {campaignsPerMonth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={campaignsPerMonth}
                    onChange={(e) => setCampaignsPerMonth(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>30</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Active Flows: {numberOfFlows}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={numberOfFlows}
                    onChange={(e) => setNumberOfFlows(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Retainer: {formatCurrency(monthlyRetainer)}
                  </label>
                  <input
                    type="range"
                    min="2000"
                    max="10000"
                    step="500"
                    value={monthlyRetainer}
                    onChange={(e) => setMonthlyRetainer(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$2k</span>
                    <span>$10k</span>
                  </div>
                </div>

                {/* Manual Overrides */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 Manual Overrides (Optional)</h3>
                  
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
                          className="w-4 h-4"
                        />
                        <label htmlFor="manualCampaign" className="text-sm font-medium text-gray-700">
                          Set Average Campaign Revenue
                        </label>
                      </div>
                      {useManualCampaignRev && (
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500">$</span>
                          <input
                            type="number"
                            value={manualAvgCampaignRev}
                            onChange={(e) => setManualAvgCampaignRev(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
                            placeholder={`Default: ${formatCurrency(calculations.avgCampaignRev)}`}
                          />
                        </div>
                      )}
                      {!useManualCampaignRev && (
                        <div className="text-xs text-gray-500 ml-6">
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
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
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

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur col-span-2">
                  <div className="text-sm opacity-90 mb-1">Total Email Revenue</div>
                  <div className="text-3xl font-bold">{formatCurrency(calculations.totalEmailRevenue)}/mo</div>
                  <div className="text-xs opacity-75 mt-1">
                    ${formatNumber(calculations.totalEmailRPR, 2)} total RPR • {formatNumber(calculations.emailPercentOfRevenue, 1)}% email-attributed revenue
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📈 Campaign Volume vs Revenue
              </h2>
              <div className="relative h-64 mb-4">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 50}
                      x2="400"
                      y2={i * 50}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Campaign revenue curve */}
                  <polyline
                    points={campaignChartData.map((point, i) => {
                      const x = (i / (campaignChartData.length - 1)) * 400
                      const maxRevenue = Math.max(...campaignChartData.map(p => p.revenue))
                      const y = 200 - (point.revenue / maxRevenue) * 180
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  
                  {/* Current position marker */}
                  {(() => {
                    const currentPoint = campaignChartData[campaignsPerMonth - 1]
                    const x = ((campaignsPerMonth - 1) / (campaignChartData.length - 1)) * 400
                    const maxRevenue = Math.max(...campaignChartData.map(p => p.revenue))
                    const y = 200 - (currentPoint.revenue / maxRevenue) * 180
                    return (
                      <>
                        <circle cx={x} cy={y} r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                        <text x={x} y={y - 15} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
                          You are here
                        </text>
                      </>
                    )
                  })()}
                </svg>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between text-xs text-gray-600 pr-2 text-right">
                  {[4, 3, 2, 1, 0].map(i => {
                    const maxRevenue = Math.max(...campaignChartData.map(p => p.revenue))
                    const value = (maxRevenue * i) / 4
                    return (
                      <div key={i}>{formatCurrency(value)}</div>
                    )
                  })}
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-20 right-0 flex justify-between text-xs text-gray-600 mt-2">
                  <span>1</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20</span>
                  <span>30</span>
                </div>
              </div>
              
              <div className="text-center mt-6 mb-2">
                <div className="text-sm font-medium text-gray-700">Campaigns per Month</div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">* Linear scaling pattern:</span> Campaign revenue grows linearly 
                  up to 10-15 campaigns/month for most brands, then plateaus. Some brands peak at 25-30 campaigns. 
                  Only testing and actually sending that volume can show what works for your brand.
                </p>
              </div>
            </div>

            {/* Flow Revenue Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ⚙️ Flow Count vs Revenue
              </h2>
              <div className="relative h-64 mb-4">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 50}
                      x2="400"
                      y2={i * 50}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Flow revenue curve */}
                  <polyline
                    points={flowChartData.map((point, i) => {
                      const x = (i / (flowChartData.length - 1)) * 400
                      const maxRevenue = Math.max(...flowChartData.map(p => p.revenue))
                      const y = 200 - (point.revenue / maxRevenue) * 180
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                  />
                  
                  {/* Shaded area for first 10 flows (50% of revenue) */}
                  <text x="130" y="100" fill="#8b5cf6" fontSize="14" fontWeight="bold" opacity="0.3">
                    ~50% of revenue
                  </text>
                  <line x1="133" y1="0" x2="133" y2="200" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4" opacity="0.3" />
                  
                  {/* Current position marker */}
                  {(() => {
                    const currentPoint = flowChartData[numberOfFlows - 1]
                    const x = ((numberOfFlows - 1) / (flowChartData.length - 1)) * 400
                    const maxRevenue = Math.max(...flowChartData.map(p => p.revenue))
                    const y = 200 - (currentPoint.revenue / maxRevenue) * 180
                    return (
                      <>
                        <circle cx={x} cy={y} r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                        <text x={x} y={y - 15} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
                          You are here
                        </text>
                      </>
                    )
                  })()}
                </svg>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between text-xs text-gray-600 pr-2 text-right">
                  {[4, 3, 2, 1, 0].map(i => {
                    const maxRevenue = Math.max(...flowChartData.map(p => p.revenue))
                    const value = (maxRevenue * i) / 4
                    return (
                      <div key={i}>{formatCurrency(value)}</div>
                    )
                  })}
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-20 right-0 flex justify-between text-xs text-gray-600 mt-2">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20</span>
                  <span>30</span>
                </div>
              </div>
              
              <div className="text-center mt-6 mb-2">
                <div className="text-sm font-medium text-gray-700">Number of Active Flows</div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">* Diminishing returns pattern:</span> The first 5-10 fundamental 
                  flows generate ~50% of total flow revenue. After 10 flows, each additional flow produces less 
                  incremental revenue. Only testing can show the optimal flow count for your brand.
                </p>
              </div>
            </div>

            {/* Success Spectrum */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🎯 Industry Performance Spectrum
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Campaign revenue scales linearly up to {industry.best.campaigns}/month for most brands
              </p>

              <div className="space-y-4">
                {scenarioData.map((scenario, idx) => (
                  <div key={scenario.key} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          scenario.color === 'red' ? 'bg-red-500' :
                          scenario.color === 'yellow' ? 'bg-yellow-500' :
                          scenario.color === 'blue' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {scenario.label}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {scenario.campaigns} campaigns • {scenario.flows} flows
                      </span>
                    </div>
                    
                    <div className={`rounded-lg p-4 ${
                      scenario.color === 'red' ? 'bg-red-50 border-2 border-red-200' :
                      scenario.color === 'yellow' ? 'bg-yellow-50 border-2 border-yellow-400' :
                      scenario.color === 'blue' ? 'bg-blue-50 border-2 border-blue-200' :
                      'bg-green-50 border-2 border-green-200'
                    }`}>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Revenue</div>
                          <div className="font-bold text-gray-900">
                            {formatCurrency(scenario.totalRevenue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Net Profit</div>
                          <div className="font-bold text-gray-900">
                            {formatCurrency(scenario.netProfit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">ROI</div>
                          <div className="font-bold text-gray-900">
                            {formatNumber(scenario.netROI, 1)}x
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        {formatNumber(scenario.emailPercent, 1)}% of total revenue from email
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                <div className="font-semibold text-blue-900 mb-3 text-lg">💡 Opportunity Analysis</div>
                
                {/* Comparison Grid */}
                <div className="space-y-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold text-red-700">90% of Brands</span> → <span className="font-semibold text-yellow-700">Your Current Setup</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-900">
                          +{formatCurrency((scenarioData[1].netProfit - scenarioData[0].netProfit) * 12)}
                        </div>
                        <div className="text-xs text-gray-600">annual profit gain</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold text-red-700">90% of Brands</span> → <span className="font-semibold text-green-700">Best-in-Class (Top 1%)</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-900">
                          +{formatCurrency((scenarioData[3].netProfit - scenarioData[0].netProfit) * 12)}
                        </div>
                        <div className="text-xs text-gray-600">total opportunity</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mars Copywriting Timeline */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white mt-4">
                  <div className="font-bold text-lg mb-3">🚀 Mars Copywriting Timeline</div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-full px-3 py-1 font-bold text-xs whitespace-nowrap">14 Days</div>
                      <div className="flex-1">
                        <div className="font-semibold">Initial Setup Complete</div>
                        <div className="text-white/90 text-xs mt-1">
                          Copywriting → Design → Your Approval. All deliverables implemented.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-full px-3 py-1 font-bold text-xs whitespace-nowrap">1-2 Months</div>
                      <div className="flex-1">
                        <div className="font-semibold">Good Performance Level</div>
                        <div className="text-white/90 text-xs mt-1">
                          Optimized campaigns, core flows dialed in, revenue accelerating.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-full px-3 py-1 font-bold text-xs whitespace-nowrap">3-6 Months</div>
                      <div className="flex-1">
                        <div className="font-semibold">Best-in-Class (Top 1%)</div>
                        <div className="text-white/90 text-xs mt-1">
                          Advanced segmentation, full flow suite, maximized email revenue.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insight */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">✅ Bottom Line</h3>
              <p className="text-white/90 leading-relaxed text-lg">
                Email generates <span className="font-bold text-2xl">{formatCurrency(calculations.netProfitFromEmail)}</span> in
                monthly profit at <span className="font-bold">{formatNumber(calculations.netROI, 1)}x net ROI</span>.
              </p>
              <p className="text-white/80 text-sm mt-3">
                Most brands send {industry.typical.campaigns} campaigns/month. You're sending {campaignsPerMonth}.
                Top performers send {industry.best.campaigns}+.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Based on Klaviyo benchmarks from 325B+ emails • RPR = Revenue Per Recipient</p>
          <p className="mt-2">Profit ROI accounts for gross margins. Revenue ROI is typically 4-5x higher.</p>
        </div>
      </div>
    </main>
  )
}
