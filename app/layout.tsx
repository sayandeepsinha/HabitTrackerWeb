import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { DevSwCleanup } from '@/components/habit-tracker/dev-sw-cleanup'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <DevSwCleanup />
          {children}
          <Analytics />
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  )
}
