import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cancellation Policy — Mars Copywriting',
}

export default function CancellationPage() {
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
        <h1 className="text-4xl font-bold text-white mb-2">Cancellation Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: January 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Month-to-month billing</h2>
            <p>Services are billed monthly. There are no long-term contracts or lock-in periods. You may cancel at any time before your next billing cycle and you will not be charged again.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">How to cancel</h2>
            <p>To cancel your retainer, simply email us at <a href="mailto:jacob@marscopywriting.com" className="text-purple-400 hover:text-purple-300 transition-colors">jacob@marscopywriting.com</a> before your next billing date. We will confirm your cancellation in writing.</p>
            <p className="mt-3">Cancellations take effect at the end of the period already paid for.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">Questions</h2>
            <p>If you have any questions about billing or cancellation, reach out at <a href="mailto:jacob@marscopywriting.com" className="text-purple-400 hover:text-purple-300 transition-colors">jacob@marscopywriting.com</a>.</p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#08080f] border-t border-white/8 px-6 pt-8 pb-6">
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
              <Link href="/cancellation" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Cancellation Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
