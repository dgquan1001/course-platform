import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { Suspense } from 'react'
import NavigationProgress from '@/components/NavigationProgress'
import SiteHeader from '@/components/SiteHeader'
import Toaster from '@/components/Toaster'
import SiteFooter from '@/components/SiteFooter'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

const font = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} – ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ['/images/trung-tam-hv.jpg'],
    locale: 'vi_VN',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#3777AA',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="flex min-h-screen flex-col">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Toaster />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
