import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar, Footer } from '@/components/docflow/docflow'

export const metadata: Metadata = {
  title: 'Page Not Found (404)',
  description: 'The page you are looking for could not be found. Explore PDFmesh’s free online PDF tools instead.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="error-page">
        <div className="container error-inner">
          <span className="error-code">404</span>
          <h1>Page not found</h1>
          <p>
            The page you are looking for doesn&rsquo;t exist or may have moved. Let&rsquo;s get you
            back on track.
          </p>
          <div className="error-actions">
            <Link href="/" className="button button-primary button-large">Back to home</Link>
            <Link href="/#tools" className="button button-secondary button-large">Explore PDF tools</Link>
          </div>
          <div className="error-links">
            <span>Popular tools:</span>
            <Link href="/pdf-to-word">PDF to Word</Link>
            <Link href="/merge-pdf">Merge PDF</Link>
            <Link href="/compress-pdf">Compress PDF</Link>
            <Link href="/jpg-to-pdf">JPG to PDF</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
