import type { Metadata } from 'next'
import { HomePage } from '@/components/docflow/docflow'
import { FAQ_ITEMS } from '@/lib/faq-data'

const SITE_URL = 'https://pdfmesh.vercel.app'

export const metadata: Metadata = {
  title: 'PDF to Word, Merge, Compress & Convert PDF — Free Online PDF Tools',
  description:
    'Free online PDF converter and editor. Convert PDF to Word, merge and combine PDF, compress PDF, JPG to PDF, PDF to JPG, split PDF, and Word to PDF — fast, secure, and free with no sign-up.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: 'Free Online PDF Tools — Convert PDF to Word, Merge & Compress PDF',
    description:
      'Convert PDF to Word, merge PDF, compress PDF, JPG to PDF, PDF to JPG and more. A fast, secure, free PDF converter and toolkit.',
  },
}

// Structured data helps search engines understand the site and tools (rich results).
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'PDFmesh',
      url: SITE_URL,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Free online PDF tools to convert PDF to Word, merge PDF, compress PDF, convert JPG to PDF and PDF to JPG, split PDF, and Word to PDF.',
      featureList: [
        'PDF to Word',
        'Word to PDF',
        'Merge PDF',
        'Split PDF',
        'Compress PDF',
        'JPG to PDF',
        'PDF to JPG',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `<p>${item.a}</p>`,
        },
      })),
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  )
}
