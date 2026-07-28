/**
 * Page content that both the rendered sections and the JSON-LD read from.
 *
 * Deliberately not a client module: layout.tsx is a server component and
 * needs these to emit structured data into the initial HTML. The landing
 * page bails to client rendering because of useSearchParams, so anything
 * rendered inside it never reaches the server response.
 */

// Single source of truth: these feed both the rendered sections and the
// JSON-LD in StructuredData, so the markup can never drift from the page.
export const FAQS = [
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
]

export const CASE_STUDIES = [
              {
                brand: 'PATCHED',
                folder: 'patched',
                keyResult: '$776K',
                headlineBig: ' in email revenue in 6 months.',
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
                keyResult: 'CA$322K',
                headlineBig: ' in email revenue in 6 months.',
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
]
