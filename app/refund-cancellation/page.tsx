import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Mars Copywriting',
}

export default function RefundCancellationPage() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08080f]/60 backdrop-blur-lg border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-white text-xl tracking-tight">Mars Copywriting</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#services" className="text-sm text-gray-400 hover:text-white transition-colors">Services</Link>
            <Link href="/#results" className="text-sm text-gray-400 hover:text-white transition-colors">Results</Link>
            <Link href="/#reviews" className="text-sm text-gray-400 hover:text-white transition-colors">Reviews</Link>
            <Link href="/#calculator" className="text-sm text-gray-400 hover:text-white transition-colors">ROI Calculator</Link>
          </div>
          <Link href="/#calculator" className="text-sm text-white bg-purple-600 hover:bg-purple-500 font-semibold px-4 py-2 rounded-lg transition-all duration-200">
            Book a Call
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl font-normal text-white mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: July 2026 · Mars Copywriting j.d.o.o.</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* ── CANCELLATION ── */}
          <section>
            <h2 className="text-xl font-normal text-white mb-5">Cancellation Policy</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-normal text-white mb-2">Month-to-month billing</h3>
                <p>Services are billed monthly. There are no long-term contracts or lock-in periods. You may cancel at any time before your next billing cycle and you will not be charged again.</p>
              </div>

              <div>
                <h3 className="text-base font-normal text-white mb-2">How to cancel</h3>
                <p>To cancel your retainer, simply email us at <a href="mailto:jacob@marscopywriting.com" className="text-purple-400 hover:text-purple-300 transition-colors">jacob@marscopywriting.com</a> before your next billing date. We will confirm your cancellation in writing.</p>
                <p className="mt-3">Cancellations take effect at the end of the period already paid for.</p>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-white/[0.08]" />

          {/* ── REFUNDS ── */}
          <section>
            <h2 className="text-xl font-normal text-white mb-5">Refund Policy</h2>

            <div className="space-y-6">
              <div className="rounded-xl border border-purple-700/40 bg-purple-950/25 p-6">
                <h3 className="text-base font-normal text-white mb-2">90-Day Performance Guarantee</h3>
                <p>If we don&rsquo;t hit $50,000 in attributed revenue as measured in your Klaviyo dashboard within the first 90 days, you get every dollar back.</p>
                <p className="mt-3">The guarantee applies to brands doing at least $1M per year in store revenue. If you&rsquo;re not happy after 90 days and we didn&rsquo;t hit the guarantee, you get a full refund and you can walk away.</p>
                <p className="mt-3 text-sm text-purple-300/80">Attributed revenue is measured in your own Klaviyo dashboard, over the 90 days beginning on your first billing date. This guarantee takes precedence over the general refund terms below.</p>
              </div>

              <div>
                <h3 className="text-base font-normal text-white mb-2">General policy</h3>
                <p>Except as provided under the 90-Day Performance Guarantee above, all payments for email copywriting and email marketing services are non-refundable once work has commenced.</p>
              </div>

              <div>
                <h3 className="text-base font-normal text-white mb-2">If we cannot deliver</h3>
                <p>If we are unable to deliver the agreed services, you will receive a full refund for the undelivered work.</p>
              </div>

              <div>
                <h3 className="text-base font-normal text-white mb-2">No guarantee of results beyond the 90-Day Performance Guarantee</h3>
                <p>Other than the 90-Day Performance Guarantee set out above, we do not guarantee specific revenue results, open rates, or other performance outcomes, as these depend on factors outside our control — including list quality, audience, offer, and market conditions.</p>
              </div>

              <div>
                <h3 className="text-base font-normal text-white mb-2">How refunds are processed</h3>
                <p>Refunds, where applicable, are returned to the original payment method within 5–10 business days.</p>
              </div>

              <div>
                <h3 className="text-base font-normal text-white mb-2">Refund requests</h3>
                <p>To request a refund, contact us at <a href="mailto:jacob@marscopywriting.com" className="text-purple-400 hover:text-purple-300 transition-colors">jacob@marscopywriting.com</a>.</p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#08080f] border-t border-white/[0.08] px-6 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 mb-6">
            <Link href="/" className="font-bold text-white text-lg tracking-tight">Mars Copywriting</Link>
            <nav className="flex items-center gap-8">
              <Link href="/#services" className="text-sm text-gray-500 hover:text-white transition-colors">Services</Link>
              <Link href="/#results" className="text-sm text-gray-500 hover:text-white transition-colors">Results</Link>
              <Link href="/#reviews" className="text-sm text-gray-500 hover:text-white transition-colors">Reviews</Link>
              <Link href="/#calculator" className="text-sm text-gray-500 hover:text-white transition-colors">ROI Calculator</Link>
            </nav>
            <div className="text-sm text-gray-600">© 2026 Mars Copywriting</div>
          </div>
          <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
              Mars Copywriting j.d.o.o. is registered at Topoljska ulica 15B, 10255, Donji Stupnik, Croatia. Company director: Jakov Maršić. Active since 30 January 2024.
            </p>
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <span className="text-gray-700 text-xs">·</span>
              <Link href="/refund-cancellation" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Refund &amp; Cancellation Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
