import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Email Marketing ROI Calculator',
  description: 'Calculate the real ROI of your email marketing campaigns',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
