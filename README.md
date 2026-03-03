# Email Marketing ROI Calculator

A professional ROI calculator for email marketing agencies built with **real Klaviyo benchmark data**. Shows profit-based returns with industry benchmarks, performance spectrum visualization, and interactive revenue charts.

Built for **Mars Copywriting** to demonstrate email marketing ROI to prospects in the wellness, beauty, health, supplements, and fitness niches.

---

## 🎯 What This Calculator Does

This tool helps prospects understand:
1. **Their current email performance** vs industry benchmarks
2. **Opportunity gaps** between their setup and top performers
3. **ROI projections** based on real Klaviyo data (325B+ emails)
4. **Traffic-to-revenue funnel** from website visitors → email subscribers → revenue
5. **Timeline to results** with Mars Copywriting (14 days to 6 months)

---

## 📊 Key Features

### 1. **Real Klaviyo Benchmark Data**
- Uses official Klaviyo benchmarks from 325B+ emails
- 3 revenue brackets: $0-1M, $1M-5M, $5M-20M annual revenue
- Scales linearly within brackets (not just median values)
- Flow RPR by AOV ranges ($0-$300+)
- Separate benchmarks for:
  - Abandoned Cart flows
  - Welcome Series flows
  - Post-Purchase flows
  - Browse Abandonment flows (estimated)

### 2. **Traffic-Based Flow Calculator**
- **Input:** Monthly website traffic + pop-up conversion rate
- **Output:** New subscribers per month
- **Key insight:** Flow revenue ONLY comes from new subscribers entering flows
- Shows pop-up benchmarks (1-3% typical, 5-8% good, 10%+ excellent)

### 3. **Campaign Multiplier Effect**
- More campaigns = more email engagement
- Formula: `1 + (campaigns × 0.015)` capped at 25%
- Example: 15 campaigns = 22.5% boost to flow revenue
- Why: More campaigns → more clicks → more flow triggers (cart, browse, post-purchase)

### 4. **Performance Spectrum Visualization**
Shows 4 performance tiers:
- 🔴 **90% of Brands (Underperforming):** 2 campaigns/month, 3 flows
- 🟡 **Your Current Setup:** User's actual configuration
- 🔵 **Good Performance:** 10-15 campaigns/month, 10 flows
- 🟢 **Best-in-Class (Top 1%):** 20-25 campaigns/month, 15 flows

### 5. **Interactive Revenue Charts**
- **Campaign Volume vs Revenue:** Linear scaling, peaks at 15-25 campaigns
- **Flow Count vs Revenue:** Steep growth for first 10 flows, diminishing returns after
- Both charts show "You are here" marker with current position

### 6. **Opportunity Analysis**
Compares:
- **90% of Brands → Your Setup:** Shows current advantage
- **90% of Brands → Best-in-Class:** Shows total opportunity

Plus **Mars Copywriting timeline:**
- 14 days: Initial setup complete
- 1-2 months: Good Performance level
- 3-6 months: Best-in-Class (Top 1%)

---

## 🏗️ Technical Architecture

### Stack
- **Next.js 14** (React framework)
- **TypeScript** (type safety)
- **Tailwind CSS** (styling)
- **Static Site Generation** (fast, SEO-friendly)

### Project Structure
```
email-roi-calculator/
├── app/
│   ├── page.tsx          # Main calculator component (1090 lines)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles + Tailwind
├── package.json          # Dependencies
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

---

## 📐 How the Math Works

### Revenue Brackets & Scaling

**The calculator determines your position within a revenue bracket:**

```typescript
// Example: $3M annual revenue in $1M-5M bracket
Position = ($3M - $1M) / ($5M - $1M) = 50%

// Then scales RPR from 25th to 75th percentile
RPR = rpr25 + (Position × (rpr75 - rpr25))

// For abandoned cart at AOV $95:
RPR = $2.39 + (0.50 × ($5.86 - $2.39)) = $4.13
```

**This ensures:**
- $10/month business = low RPR (just starting)
- $250k/month business = mid RPR (established)
- $1M+/month business = high RPR (optimized)

### Flow Revenue Calculation

```typescript
// 1. Get new subscribers from traffic
newSubscribers = monthlyTraffic × (popupRate / 100)

// 2. Get Klaviyo RPR benchmarks for your bracket + AOV
totalFlowRPR = abandonedCartRPR + welcomeRPR + postPurchaseRPR + browseRPR

// 3. Apply flow efficiency (based on # of flows)
if (flows <= 4) {
  efficiency = flows / 4  // Scale up to core 4 flows
} else {
  efficiency = 1.0 + ((flows - 4) × 0.15)  // Each extra flow adds 15%
}

// 4. Apply campaign multiplier
multiplier = Math.min(1 + (campaigns × 0.015), 1.25)

// 5. Calculate flow revenue
flowRevenue = newSubscribers × totalFlowRPR × efficiency × multiplier
```

### Campaign Revenue Calculation

```typescript
// Simple linear calculation
campaignRevenue = campaignsPerMonth × campaignRPR × engagedListSize

// Where:
// - campaignRPR comes from industry benchmarks (e.g. $0.074 for Health & Beauty)
// - engagedListSize = totalListSize × 0.4 (40% engaged segment)
```

### ROI Calculations

```typescript
// Gross ROI (revenue-based)
grossROI = totalEmailRevenue / totalCosts

// Net ROI (profit-based - what we show prominently)
grossProfit = totalEmailRevenue × (marginPercent / 100)
netProfit = grossProfit - totalCosts
netROI = netProfit / totalCosts

// Total Costs = monthlyRetainer + klaviyoCost
```

---

## 🎨 Main Code Components

### 1. **Industry Benchmarks** (Lines 6-71)
Campaign RPR values for 8 ecommerce industries, sourced from Klaviyo's 325B+ email dataset.

### 2. **Klaviyo Pricing Tiers** (Lines 74-93)
Official Klaviyo pricing based on profile count ($0 for 250 profiles → $4,900 for 500k).

### 3. **Flow Benchmarks** (Lines 97-199)
Klaviyo's official flow RPR data broken down by:
- Revenue bracket ($0-1M, $1M-5M, $5M-20M)
- AOV range ($0-$28, $28-$37, ..., $291+)
- Flow type (Abandoned Cart, Welcome, Post-Purchase)

### 4. **getFlowRPR Function** (Lines 201-235)
**Purpose:** Gets the correct RPR benchmarks and scales them based on business size.

**How it works:**
1. Determines which revenue bracket you're in
2. Calculates your position within that bracket (0-100%)
3. Finds the AOV range that matches your average order value
4. Scales RPR from 25th to 75th percentile based on position
5. Returns individual RPRs for each flow type

### 5. **State Management** (Lines 107-118)
All user inputs stored in React state:
- Email list size
- Campaigns per month
- Number of flows
- Monthly retainer
- Gross margin
- Total monthly revenue
- Average Order Value (AOV)
- Monthly traffic
- Pop-up conversion rate

### 6. **Main Calculations** (Lines 128-215)
**The heart of the calculator:**
- Gets flow RPR benchmarks for current revenue + AOV
- Calculates new subscribers from traffic × pop-up rate
- Applies campaign multiplier (1.5% per campaign, capped at 25%)
- Calculates campaign revenue (campaigns × RPR × engaged list)
- Calculates flow revenue (new subs × total RPR × efficiency × multiplier)
- Computes total email revenue, costs, and ROI metrics

### 7. **Scenario Comparisons** (Lines 217-256)
Calculates 4 performance scenarios:
- Typical (90% of brands)
- Your current setup
- Good performance
- Best-in-Class (Top 1%)

### 8. **Chart Data Generation** (Lines 271-318)
**Campaign Chart:** Shows linear growth up to 15 campaigns, then plateau
**Flow Chart:** Shows steep growth for first 10 flows, then diminishing returns

### 9. **UI Components**
- **Industry Selector** (Lines 325-356): Dropdown with campaign/flow RPR display
- **Business Inputs** (Lines 360-430): Revenue, AOV, margin sliders
- **Traffic & Pop-up** (Lines 434-520): Website traffic and conversion inputs
- **Email Strategy** (Lines 524-630): Campaigns, flows, retainer configuration
- **Performance Display** (Lines 745-810): Blue gradient box showing current metrics
- **Revenue Charts** (Lines 814-988): Interactive SVG charts with position markers
- **Performance Spectrum** (Lines 990-1064): Color-coded comparison boxes
- **Opportunity Analysis** (Lines 1053-1120): Profit comparisons + Mars timeline

---

## 🚀 Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Opens at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Push to GitHub
2. Vercel auto-deploys from `main` branch
3. Live in ~2 minutes

---

## 📝 Key Design Decisions

### Why Traffic-Based Flow Calculation?
**Problem:** Original calculator used list size × RPR, which was inaccurate.  
**Reality:** Flow revenue comes from NEW SUBSCRIBERS entering flows, not total list.  
**Solution:** Traffic → Pop-up → New Subs → Flow Revenue (accurate funnel model)

### Why Linear Scaling Within Brackets?
**Problem:** Using median RPR meant $10/month = same as $500k/month revenue.  
**Reality:** Bigger businesses have better-optimized email programs.  
**Solution:** Scale from 25th to 75th percentile based on revenue position.

### Why Campaign Multiplier?
**Problem:** Original model treated campaigns and flows as independent.  
**Reality:** More campaigns = more engagement = more people re-triggering flows.  
**Solution:** 1.5% boost per campaign, capped at 25% (based on client data).

### Why Show Net ROI (Profit-Based)?
**Problem:** Gross ROI (revenue/cost) looks misleadingly high.  
**Reality:** Clients care about profit after margins and costs.  
**Solution:** Default to Net ROI, show gross ROI as secondary metric.

### Why Remove Manual RPR Overrides?
**Problem:** Too many knobs confused users (3 different flow RPR numbers).  
**Reality:** Klaviyo benchmarks are accurate enough for most use cases.  
**Solution:** Auto-calculate from real data, remove manual overrides.

---

## 🎯 Use Cases

### For Prospects
1. **Discovery calls:** Share screen and input their numbers live
2. **Proposals:** Include screenshot of their opportunity
3. **Follow-ups:** "Here's what email could do for you..."

### For Current Clients
1. **Quarterly reviews:** Show progress from start to now
2. **Upsells:** Demonstrate gap to next performance tier
3. **Retention:** Prove ongoing ROI and value

### For Content Marketing
1. **Case studies:** Show before/after using real data
2. **Blog posts:** Embed calculator for lead generation
3. **Social proof:** "Our clients average X% email-attributed revenue"

---

## 📚 Data Sources

- **Klaviyo Flow Benchmarks:** https://help.klaviyo.com/hc/en-us/articles/115005084927
- **Klaviyo Campaign Benchmarks:** 325B+ emails dataset (public benchmarks)
- **Klaviyo Pricing:** Official 2025 pricing tiers
- **Campaign Multiplier:** Based on client data analysis (proprietary)
- **Flow Efficiency:** Derived from Klaviyo's "Top 10% vs Average" metrics

---

## 🤝 Contributing

This is a private tool for Mars Copywriting. For changes or suggestions, use Claude Code connected to this repo.

---

## 📄 License

Private - Mars Copywriting © 2026

---

## 🙏 Credits

Built with Claude (Anthropic) and deployed on Vercel.

**Developer:** Claude (AI Assistant)  
**Project Owner:** Mars Copywriting  
**Framework:** Next.js 14 + TypeScript + Tailwind CSS
