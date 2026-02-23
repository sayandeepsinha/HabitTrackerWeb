import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { MobileGuard } from '@/components/habit-tracker/mobile-guard'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'A beautiful, minimalist habit tracking dashboard',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/plant.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/plant.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#FDFBF7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <MobileGuard>
          {children}
        </MobileGuard>
        <Analytics />
      </body>
    </html>
  )
}
