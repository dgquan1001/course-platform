import type { Metadata } from 'next'
import HomePage from '@/components/home/HomePage'
import { homeCopy } from '@/lib/i18n'

// Trang chủ tiếng Anh (ADR-018) – tĩnh như trang chủ tiếng Việt
export const revalidate = 300

const t = homeCopy.en

export const metadata: Metadata = {
  title: { absolute: t.metaTitle },
  description: t.metaDescription,
  alternates: { canonical: '/en', languages: { vi: '/', en: '/en' } },
  openGraph: {
    title: t.metaTitle,
    description: t.metaDescription,
    images: ['/images/trung-tam-hv.jpg'],
    locale: 'en_US',
    type: 'website',
  },
}

export default function Page() {
  return <HomePage locale="en" />
}
