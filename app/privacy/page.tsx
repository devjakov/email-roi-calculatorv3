import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Mars Copywriting',
}

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-normal text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: January 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-normal text-white mb-3">Who we are</h2>
            <p>Mars Copywriting j.d.o.o., registered at Topoljska ulica 15B, 10255, Donji Stupnik, Croatia.</p>
            <p className="mt-2">Contact: <a href="mailto:jacob@marscopywriting.com" className="text-purple-400 hover:text-purple-300 transition-colors">jacob@marscopywriting.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-white mb-3">What we collect and why</h2>
            <p>When you fill out a booking or contact form on this website, we collect your name, email address, and any information you choose to share about your business. We use this only to respond to your enquiry and, if you become a client, to manage our working relationship.</p>
            <p className="mt-3">We do not collect data through newsletter signups. We do not run a public email list.</p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-white mb-3">Cookies and analytics</h2>
            <p>This website may use basic analytics (such as Google Analytics) to understand how visitors use the site. This may involve cookies that collect anonymised data like pages visited and time on site. No personally identifiable information is collected through analytics. You can disable cookies in your browser settings at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-white mb-3">Third-party tools</h2>
            <p>We use Klaviyo to manage email marketing on behalf of our clients. Klaviyo processes data under its own privacy policy, available at <a href="https://www.klaviyo.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">klaviyo.com/legal/privacy</a>. We do not share your personal data with Klaviyo or any other third party for our own marketing purposes.</p>
            <p className="mt-3">We may use tools like Calendly or a similar booking platform to schedule calls. If you book through a third-party tool, their privacy policy applies to that interaction.</p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-white mb-3">Data storage and security</h2>
            <p>Your data is stored securely and accessed only by us. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-white mb-3">How long we keep your data</h2>
            <p>If you contact us but do not become a client, we retain your information for up to 12 months, after which it is deleted. If you become a client, we retain relevant business records for as long as legally required.</p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-white mb-3">Your rights (GDPR)</h2>
            <p>You have the right to access the personal data we hold about you, request corrections, request deletion, and withdraw consent at any time. To exercise any of these rights, email us at <a href="mailto:jacob@marscopywriting.com" className="text-purple-400 hover:text-purple-300 transition-colors">jacob@marscopywriting.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-normal text-white mb-3">Changes to this policy</h2>
            <p>We may update this policy occasionally. The date at the top of this page reflects the most recent revision.</p>
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
              <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <span className="text-gray-700 text-xs">·</span>
              <Link href="/refund-cancellation" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Refund &amp; Cancellation Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
