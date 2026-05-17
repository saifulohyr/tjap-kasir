import type { Metadata, Viewport } from 'next'
import {
  Playfair_Display,
  Inter,
  JetBrains_Mono,
  Newsreader,
  Space_Grotesk,
} from 'next/font/google'
import './globals.css'
import SwRegister from '@/components/pwa/SwRegister'
import InstallPrompt from '@/components/pwa/InstallPrompt'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tjap Chacoh — Heritage POS',
  description:
    'Sistem kasir heritage untuk kedai kopi modern-tradisional. Sejak Kemarin Sore.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tjap Kasir',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#8B0000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable} ${newsreader.variable} ${spaceGrotesk.variable}`}
    >
      <body className="vintage-overlay" suppressHydrationWarning>
        <SwRegister />
        <InstallPrompt />
        {children}
      </body>
    </html>
  )
}