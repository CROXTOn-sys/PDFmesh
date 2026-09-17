import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/toast/toast'

const SITE_URL = 'https://pdfmesh.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PDFmesh — Free Online PDF Converter, Merger & Editor Tools',
    template: '%s | PDFmesh',
  },
  description:
    'PDFmesh is a free online PDF converter and toolkit. Convert PDF to Word, merge PDF, compress PDF, JPG to PDF, PDF to JPG, split PDF, and Word to PDF — fast, secure, and completely free.',
  keywords: [
    'pdf to word',
    'pdf converter',
    'pdf editor',
    'jpg to pdf',
    'pdf to jpg',
    'pdf merger',
    'pdf combiner',
    'convert pdf to word',
    'free pdf editor',
    'combine pdf',
    'merge pdf',
    'compress pdf',
    'word to pdf',
    'split pdf',
    'pdf tools',
    'free pdf converter',
    'online pdf tools',
  ],
  authors: [{ name: 'PDFmesh' }],
  creator: 'PDFmesh',
  publisher: 'PDFmesh',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'PDFmesh',
    title: 'PDFmesh — Free Online PDF Converter, Merger & Editor Tools',
    description:
      'Convert PDF to Word, merge PDF files, compress PDF, JPG to PDF, and more — all free, fast, and secure. No sign-up needed.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PDFmesh — Free Online PDF Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFmesh — Free Online PDF Converter & Tools',
    description:
      'Convert PDF to Word, merge PDF, compress PDF, JPG to PDF and more — free, fast, secure.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
